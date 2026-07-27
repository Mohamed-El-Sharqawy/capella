# Meta Ads (Pixel + Conversions API) Integration Guide

A self-contained, copy-pastable guide for replicating the proven Meta Ads integration used in this codebase (Next.js client + Elysia/Bun backend on a **different subdomain**) in a brand-new project. Every code block is pulled from the actual audited source; `source:` citations point to the original file and line range.

This store is UAE-only and uses AED. See [§17 — Porting notes](#17-uae--store-specific-porting-notes) for what to adapt.

---

## Table of contents

1. [Overview & architecture](#1-overview--architecture)
2. [Environment variables](#2-environment-variables)
3. [File structure](#3-file-structure)
4. [Browser Pixel (client) — step by step](#4-browser-pixel-client--step-by-step)
5. [The cross-origin `fbp`/`fbc` trick (CRITICAL)](#5-the-cross-origin-fbpfbc-trick-critical)
6. [CORS configuration (backend)](#6-cors-configuration-backend)
7. [The `fbclid` → `_fbc` server-side capture (ITP resilience)](#7-the-fbclid--_fbc-server-side-capture-itp-resilience)
8. [CAPI core (backend) — step by step](#8-capi-core-backend--step-by-step)
9. [The dedup contract (the heart of it)](#9-the-dedup-contract-the-heart-of-it)
10. [The async-webhook context-loss problem + solution](#10-the-async-webhook-context-loss-problem--solution)
11. [AddToCart CAPI userData — send everything you have](#11-addtocart-capi-userdata--send-everything-you-have)
12. [Buy Now / guest PII forwarding](#12-buy-now--guest-pii-forwarding)
13. [Retry-payment path](#13-retry-payment-path)
14. [Test event code + production guards](#14-test-event-code--production-guards)
15. [Verification checklist](#15-verification-checklist)
16. [Tricks & enhancements summary](#16-tricks--enhancements-summary)
17. [UAE / store-specific porting notes](#17-uae--store-specific-porting-notes)

---

## 1. Overview & architecture

### The two-layer model

Meta can receive the same conversion event from **two transports**:

| Layer | How | Why it exists |
|---|---|---|
| **Browser Pixel** (`fbq` / `fbevents.js`) | Loaded in the browser; fires events on user action. | Richer context (cookies, page URL), but **blocked by ad blockers and iOS ATT**. |
| **Conversions API (CAPI)** | Server-to-server `POST` to the Graph API. | Works when the Pixel is blocked; lets you attach **server-side PII** (hashed email/phone) for much higher Event Match Quality (EMQ). |

When both fire the same event with the **same `event_id`** and the same `fbp`, Meta **deduplicates** them into one event and uses whichever version carries more matching data. Sending both with proper dedup is the single biggest lever on EMQ.

### The cross-origin reality

This stack separates the storefront from the API on **different subdomains**:

```
Client (browser)        :  https://example.com         (Next.js)
API (server)            :  https://server.example.com  (Elysia/Bun)
```

**The single most important consequence:** the browser Pixel writes `_fbp` (browser id) as a **host-only** cookie on `example.com`. A cross-origin `fetch('https://server.example.com/...')` only attaches cookies scoped to `server.example.com` — **even with `credentials: 'include'`**, the host-only `_fbp` from the storefront never reaches the API. Without intervention, every CAPI event lacks `fbp`, which is the primary browser↔server identity link Meta uses to confirm Pixel and CAPI events describe the same session. **EMQ collapses on every server event.**

**The solution (covered in §5):** the client explicitly reads `_fbp` / `_fbc` from `document.cookie` and forwards them as `x-fbp` / `x-fbc` HTTP headers. The backend reads header-or-cookie. This is the highest-value, most-commonly-missed piece of any cross-origin Pixel+CAPI setup.

### End-to-end flow of a single deduped event (AddToCart)

```
 ┌──────────────── BROWSER ────────────────┐         ┌──────── BACKEND ────────┐         ┌──── META ────┐
 │                                          │         │                          │         │               │
 │ 1. generateEventId()  ->  evt_abc        │         │                          │         │               │
 │                                          │         │                          │         │               │
 │ 2. fbq('track','AddToCart',              │         │                          │         │  Pixel event  │
 │      {...}, {eventID: evt_abc})  ───────────────────────────────────────────────────▶     │  (browser)    │
 │                                          │         │                          │         │               │
 │ 3. fetch('/cart/items', {                │         │                          │         │               │
 │      credentials:'include',              │         │                          │         │               │
 │      referrerPolicy:'no-referrer-        │         │                          │         │               │
 │           when-downgrade',               │         │                          │         │               │
 │      headers: {                          │  HTTPS   │                          │         │               │
 │        'x-fb-event-id': evt_abc, ──────────────────▶│                          │         │               │
 │        'x-fbp': <cookie _fbp>, ────────────────────▶│                          │         │               │
 │        'x-fbc': <cookie _fbc>, ────────────────────▶│ 4. extractCapiContext()  │         │               │
 │      }                                   │         │     eventId=evt_abc      │         │               │
 │    })                                    │         │     fbp=…, fbc=…         │         │               │
 │                                          │         │     ip, ua, sourceUrl    │         │               │
 │                                          │         │                          │         │               │
 │                                          │         │ 5. trackAddToCart({      │         │               │
 │                                          │         │      eventId: evt_abc,   │         │               │
 │                                          │         │      userData:{em,ph,…}, │   POST  │               │
 │                                          │         │      context: capiCtx    │────────▶│  CAPI event   │
 │                                          │         │    })                    │         │  (server)     │
 │                                          │         │                          │         │               │
 │                                          │         │                          │         │  Meta dedupes │
 │                                          │         │                          │         │  by           │
 │                                          │         │                          │         │  (event_name, │
 │                                          │         │                          │         │   event_id)   │
 │                                          │         │                          │         │  + matching   │
 │                                          │         │                          │         │    fbp        │
 │                                          │         │                          │         │   ▼ ONE event │
 └──────────────────────────────────────────┘         └──────────────────────────┘         └───────────────┘
```

**The rule:** one `event_id` is generated client-side and threaded through BOTH `fbq(..., { eventID })` and the backend call. If any link breaks, you get duplicate or dropped events and EMQ tanks.

---

## 2. Environment variables

### Client (Next.js)

```bash
# .env.local  (client)
# REQUIRED for the Pixel to load. If unset, the loader renders nothing and
# no events fire — this is intentional so dev/preview can't contaminate prod.
NEXT_PUBLIC_FACEBOOK_PIXEL_ID="123456789012345"
```

`source: client/lib/facebook-pixel.ts:8`

```ts
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '';
```

> **Empty-fallback rule:** NEVER hardcode a production Pixel ID as the `||` fallback. A missing env var must mean "pixel off". Hardcoding silently ships prod events from every dev/preview build (the most common data-contamination bug).

### Backend (Elysia/Bun)

```bash
# .env  (backend)
# Both REQUIRED to enable CAPI. If either is missing, CAPI is a no-op
# (see isCapiEnabled() below) so the request flow is never broken.
FB_PIXEL_ID="your_facebook_pixel_id"             # MUST match NEXT_PUBLIC_FACEBOOK_PIXEL_ID
FB_CAPI_ACCESS_TOKEN="your_conversions_api_access_token"  # Meta Events Manager > Settings > Conversions API

# Optional — ONLY during validation. If set in production, ALL server events
# route to Meta's TEST pipeline and prod dashboard shows ~0 events.
FB_CAPI_TEST_EVENT_CODE=""
```

`source: backend/.env.example:44-53`

### The `isCapiEnabled()` rule

`source: backend/src/lib/facebook-capi.ts:87-89`

```ts
export function isCapiEnabled(): boolean {
  return Boolean(process.env.FB_PIXEL_ID && process.env.FB_CAPI_ACCESS_TOKEN);
}
```

Every `track*` helper and every `fire*` wrapper early-returns when this is false. **CAPI must never throw or break checkout.** If env is misconfigured, the worst case is "no server events" — never "broken payment flow".

### Graph API version pinning

`source: backend/src/lib/facebook-capi.ts:18`

```ts
const FB_GRAPH_VERSION = "v23.0";
```

Pinned once, used by every CAPI call's URL builder. Bump only when Meta deprecates (check the [Conversions API changelog](https://developers.facebook.com/docs/marketing-api/conversions-api/changelog)).

---

## 3. File structure

Mirror this layout in the new project. The responsibilities are deliberately separated so each piece is testable and the dedup contract is obvious.

```
client/
├── lib/
│   ├── facebook-pixel.ts        # Browser Pixel helpers (one per event). generateEventId, normalizePhone.
│   └── capi-headers.ts          # Reads _fbp/_fbc from document.cookie → x-fbp/x-fbc headers (CROSS-ORIGIN TRICK).
├── components/
│   └── FacebookPixel.tsx        # next/script loader + SPA PageView + Advanced Matching re-init + empty-ID guard.
└── services/
    ├── cart/api.ts              # Cart fetch calls. Spread capiHeaders() + x-fb-event-id + credentials + referrerPolicy.
    └── payment/api.ts           # Payment fetch calls. Same pattern as cart.

backend/
├── src/
│   ├── lib/
│   │   └── facebook-capi.ts     # CAPI core: types, hashing, buildUserData, sendCapiEvent, trackX wrappers,
│   │                             #   extractCapiContext, capiContextFromRecord/Order, resolveCapiUserDataFromOrder.
│   ├── modules/
│   │   ├── cart/index.ts        # Cart controller. Calls extractCapiContext(request) → trackAddToCart.
│   │   └── payment/
│   │       ├── index.ts         # Payment controller. Threads extractCapiContext(request) into every service method.
│   │       ├── service.ts       # Stripe + COD flows. capiMetadataFields / capiContextFromStripeMetadata helpers.
│   │       └── tabby-service.ts # Tabby flow. Persists CAPI context to Order.capiContext for webhook reuse.
│   └── index.ts                 # App boot: CORS (credentials:true + reflected origin), fbclid→_fbc hook, test-code warning.
└── .env.example
```

---

## 4. Browser Pixel (client) — step by step

### 4.1 Pixel loader component

`source: client/components/FacebookPixel.tsx:36-55`

```tsx
<Script
  id="facebook-pixel-base"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');
    `,
  }}
/>
```

**Why `afterInteractive`:** the Pixel needs to load before any conversion event helper can fire (e.g. AddToCart on a PDP), but it must not block First Contentful Paint. `afterInteractive` is the right Next.js strategy.

**Why `fbq('init')` + `PageView` are inside the snippet:** the very first `init` and the hard-load PageView need to happen as soon as `fbevents.js` loads. Subsequent SPA PageViews come from the effect in §4.2.

### 4.2 SPA PageView trick (the #1 thing people forget)

`source: client/components/FacebookPixel.tsx:9-16`

```tsx
export default function FacebookPixel() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!FB_PIXEL_ID) return;
    pageView();
  }, [pathname]);
  // ...
```

**Why:** App Router is a SPA. Almost all navigation (home → PDP → cart → checkout) happens without a hard reload. The initial `fbq('track','PageView')` inside the snippet only fires once on mount. Without this `usePathname()` effect, Meta sees exactly **one** PageView per session entry and zero thereafter — breaking retargeting audiences ("viewed product but didn't buy") and ad-click attribution windows for anyone who navigates after landing.

### 4.3 Empty-ID guard

`source: client/components/FacebookPixel.tsx:31-34`

```tsx
// Guard against empty FB_PIXEL_ID so dev/preview environments without the
// env var don't load the pixel or fire events into prod. Placed after all
// hooks so rules-of-hooks stays satisfied.
if (!FB_PIXEL_ID) return null;
```

**Why:** combined with `export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ''`, this means *no env var ⇒ no pixel, no events*. Prevents dev/preview traffic from contaminating the production Pixel (which inflates event counts, pollutes audiences, and drags EMQ down with junk sessions that have no real `fbp`/`fbc`/PII).

> Note the placement: the `return null` is **after** all `useEffect` hooks so React's rules-of-hooks stay satisfied.

### 4.3.5 The `noscript` img fallback

`source: client/components/FacebookPixel.tsx:56-65`

```tsx
<noscript>
  <img
    height="1"
    width="1"
    style={{ display: 'none' }}
    src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
    alt=""
  />
</noscript>
```

Catches the (rare) no-JS case so a PageView is still recorded.

### 4.4 `generateEventId()` — create ONCE per action, share

`source: client/lib/facebook-pixel.ts:23-28`

```ts
/**
 * Generate a unique event id shared between the browser Pixel and the server
 * Conversions API so Meta deduplicates the two into a single event.
 * MUST be created once per user action and passed to both `fbq(..., { eventID })`
 * and the corresponding backend API call (via the `x-fb-event-id` header).
 */
export const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};
```

**Why it must be created once and shared:** the browser `fbq('track', …, { eventID: id})` and the server's CAPI `event_id` must be byte-identical for dedup. If you call `generateEventId()` twice (once for the Pixel, once for the API), the IDs differ and Meta keeps both events — duplicate conversions, corrupted optimization.

**Usage pattern** (AddToCart as the canonical example):

```ts
const eventId = generateEventId();
addBookToCart(book, qty, eventId);              // → fbq(..., { eventID: eventId })
await cartApi.addItem(payload, eventId);        // → x-fb-event-id: eventId
```

### 4.5 Browser event helpers — one full example

`source: client/lib/facebook-pixel.ts:112-130`

```ts
// Track adding a book to cart
export const addBookToCart = (book: {
  id: string;
  enTitle: string;
  arTitle: string;
  price: string | number;
}, quantity: number = 1, eventId?: string) => {
  const id = eventId || generateEventId();
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [`book_${book.id}`],
      content_type: 'product',
      content_name: `${book.enTitle} | ${book.arTitle}`,
      value: Number(book.price) * quantity,
      currency: 'AED',
      contents: [{ id: `book_${book.id}`, quantity }],
    }, { eventID: id });
  }
  return id;
};
```

**Key points:**

1. **The third argument** is the event-level options object carrying `{ eventID: id }`. This is *separate* from the second-argument `customData` object (`content_ids`, `value`, …). Beginners often put `eventID` inside `customData` by mistake — Meta won't see it there.
2. **`content_ids` format** is `book_<id>` (or `collection_<id>` / `game_<id>`). This MUST match the server's `toContentId()` output (§8.5) byte-for-byte or Meta can't cross-reference events against your catalog/feed.
3. **`currency`** is `'AED'` everywhere — must match the campaign's configured currency.
4. **`value`** for AddToCart is `price * quantity` (line total, not unit price).
5. The helper returns the `id` so the call site can forward it to the API.

`source: client/lib/facebook-pixel.ts:231-253` — InitiateCheckout is the multi-item variant:

```ts
export const initiateCheckout = (items: {
  id: string;
  type: 'book' | 'collection' | 'game';
  price: number;
  quantity: number;
}[], totalValue: number, eventId?: string) => {
  const id = eventId || generateEventId();
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map(item => `${item.type}_${item.id}`),
      content_type: 'product',
      value: totalValue,
      currency: 'AED',
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      contents: items.map(item => ({
        id: `${item.type}_${item.id}`,
        quantity: item.quantity,
      })),
    }, { eventID: id });
  }
  return id;
};
```

### 4.6 Browser Advanced Matching

`source: client/components/FacebookPixel.tsx:18-29`

```tsx
// Advanced Matching: when a logged-in user's email/phone is known, re-init
// the Pixel with them so subsequent browser events carry matching data and
// EMQ climbs. Meta's fbevents.js SHA-256-hashes `em`/`ph` internally before
// transmission; pass raw normalized values. Safe to call multiple times —
// the latest init wins.
useEffect(() => {
  if (!FB_PIXEL_ID || typeof window === 'undefined' || !window.fbq || !user?.email) return;
  const ph = user.phone ? normalizePhone(user.phone) : '';
  const advancedMatching: Record<string, string> = { em: user.email };
  if (ph) advancedMatching.ph = ph;
  window.fbq('init', FB_PIXEL_ID, advancedMatching);
}, [user?.email, user?.phone]);
```

**Why:** Browser Advanced Matching lets `fbevents.js` attach hashed `em`/`ph` to every subsequent Pixel event, lifting browser-side EMQ. The latest `fbq('init', …, {em, ph})` call wins, so it's safe to re-init when the user logs in mid-session.

**Critical:** `ph` here must use the **same normalization** as the server's `normalizePhone` so the two hashed values match. Mirror the client helper:

`source: client/lib/facebook-pixel.ts:35-43`

```ts
/**
 * Normalize a phone number to E.164 digits with country code. Mirrors the
 * backend's `normalizePhone` so browser Advanced Matching and CAPI send the
 * same `ph` value. UAE-focused (store is UAE-only) but safe for other countries.
 */
export const normalizePhone = (phone: string): string => {
  let p = phone.replace(/\D/g, '');
  if (!p) return '';
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('971')) return p;
  if (p.startsWith('0')) return '971' + p.slice(1);
  if (p.length === 9) return '971' + p;
  return p;
};
```

> If the client normalizes `0501234567` → `971501234567` but the server leaves it as `0501234567`, the SHA-256 outputs differ and Meta treats them as two different phones — **EMQ lost silently**. Always mirror.

### 4.7 The full list of standard events

`source: client/lib/facebook-pixel.ts`

| Event | Helper | Fires when |
|---|---|---|
| `PageView` | `pageView()` | Hard load (inside `fbevents.js` snippet) **and** every SPA route change via `usePathname()` effect (§4.2). |
| `ViewContent` | `viewBook` / `viewCollection` / `viewGame` (lines 51–109) | Product detail page mount. Browser-only (no CAPI counterpart in this repo — see porting note). |
| `AddToCart` | `addBookToCart` / `addCollectionToCart` / `addGameToCart` (lines 112–172) | Add-to-cart click. **Deduped with CAPI.** |
| `InitiateCheckout` | `initiateCheckout` (lines 232–253) | Checkout open / Stripe/Tabby session creation. **Deduped with CAPI.** |
| `AddPaymentInfo` | `addPaymentInfo(value, eventId?)` (lines 282–291) | Checkout form submit / focus on payment fields. Upper-funnel micro-conversion. |
| `Purchase` | `purchase(items, total, orderId)` (lines 256–279) | Success page. **Deduped with CAPI** via deterministic `purchase_<orderId>` (§9). |
| `CompleteRegistration` | `completeRegistration(eventId?)` (lines 294–300) | Successful signup. |
| `Search` | `search(query, eventId?)` (lines 303–311) | Search submit. |
| `AddToWishlist` | `addToWishlist(item, eventId?)` (lines 314–331) | Add-to-favourites. |
| `Lead` | `lead(eventId?)` (lines 334–339) | Contact form submission. |
| `RemoveFromCart` (custom) | `removeBookFromCart` / `removeCollectionFromCart` / `removeGameFromCart` (lines 175–229) | Remove-from-cart click. Fired via `fbq('trackCustom', …)` — **browser-only, no CAPI counterpart.** |

---

## 5. The cross-origin `fbp`/`fbc` trick (CRITICAL)

### Why `_fbp` is host-only and won't cross to the API subdomain

`fbevents.js` writes `_fbp` with **no `Domain=` attribute**, which means it is **host-only**: scoped to exactly the host that loaded the script (e.g. `example.com`). The browser will *not* attach it to a `fetch('https://server.example.com/...')` even when `credentials: 'include'` is set — `credentials` only governs whether **target-origin cookies** are sent, not whether source-origin cookies hop subdomains.

If you do nothing, the backend's `parseCookie(cookieHeader, "_fbp")` returns `undefined`, `extractCapiContext().fbp` is `undefined`, and **every CAPI event is missing `fbp`** — the primary browser↔server identity link Meta uses to confirm Pixel and CAPI events describe the same session. EMQ tanks on every server event.

### The `capiHeaders()` helper (the fix)

`source: client/lib/capi-headers.ts:1-16`

```ts
/**
 * Build the `x-fbp` / `x-fbc` headers from the browser cookies so the CAPI
 * backend (on a different subdomain) can read the browser-linking identifiers
 * it cannot get from host-only cookies. Safe on the server (returns `{}`).
 */
export function capiHeaders(): HeadersInit {
  if (typeof document === 'undefined') return {};
  const get = (name: string): string | undefined =>
    document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))?.[1];
  const headers: Record<string, string> = {};
  const fbp = get('_fbp');
  if (fbp) headers['x-fbp'] = fbp;
  const fbc = get('_fbc');
  if (fbc) headers['x-fbc'] = fbc;
  return headers;
}
```

**What it does:** reads `_fbp` and `_fbc` from `document.cookie` (which the storefront CAN read — they're its own cookies) and lifts them into explicit request headers. Headers cross origins freely; cookies do not.

### How to spread it into every fetch call

`source: client/services/cart/api.ts:27-55`

```ts
/**
 * Shared fetch options for every call to the API host. `credentials` sends
 * auth + `_fbp`/`_fbc` cookies cross-origin, and `referrerPolicy` ensures the
 * full page URL (including `?fbclid=...` on ad landings) reaches the backend's
 * `_fbc`-persistence hook (Next.js default `strict-origin-when-cross-origin`
 * strips the query string for cross-origin requests).
 */
const baseOptions = (): RequestInit => ({
  credentials: 'include',
  referrerPolicy: 'no-referrer-when-downgrade',
});

export const cartApi = {
  // ...
  addItem: async (data: AddCartItemInput, eventId?: string): Promise<CartItem> => {
    const res = await fetch(`${API_URL}/cart/items`, {
      ...baseOptions(),
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        ...capiHeaders(),                                          // ← x-fbp / x-fbc
        ...(eventId ? { 'x-fb-event-id': eventId } : {}),         // ← dedup id
      },
      body: JSON.stringify(data),
    });
    // ...
```

`source: client/services/payment/api.ts:15-30, 33-46` — same pattern:

```ts
function withEventId(eventId?: string): HeadersInit {
  return eventId ? { 'x-fb-event-id': eventId } : {};
}

const baseOptions = (): RequestInit => ({
  credentials: 'include',
  referrerPolicy: 'no-referrer-when-downgrade',
});

export const paymentApi = {
  checkout: async (data: CheckoutInput, eventId?: string): Promise<CheckoutResponse> => {
    const res = await fetch(`${API_URL}/payment/checkout`, {
      ...baseOptions(),
      method: 'POST',
      headers: { ...getAuthHeaders(), ...capiHeaders(), ...withEventId(eventId) },
      body: JSON.stringify(data),
    });
    // ...
```

**Spread `capiHeaders()` into every API fetch call.** Grep your codebase for `fetch(` to the API host and verify each one includes it.

### Backend side: header OR cookie

`source: backend/src/lib/facebook-capi.ts:481-495`

```ts
return {
  clientIpAddress,
  clientUserAgent: headers.get("user-agent") || undefined,
  fbp:
    headers.get("x-fbp") || parseCookie(cookieHeader, "_fbp") || undefined,
  fbc:
    headers.get("x-fbc") ||
    parseCookie(cookieHeader, "_fbc") ||
    fbcFromFbclid(referer) ||
    undefined,
  // Browser-generated event id shared with the Pixel for deduplication.
  eventId: headers.get("x-fb-event-id") || undefined,
  // Prefer the page URL (Referer); fall back to the API origin.
  eventSourceUrl: referer || origin || undefined,
};
```

The backend reads **header first, cookie as fallback**. If you ever consolidate onto a single origin, the same code keeps working without changes.

---

## 6. CORS configuration (backend)

`source: backend/src/index.ts:33-62`

```ts
const app = new Elysia()
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get('origin');

        const allowed = [
          "https://nabdalqalam.com",
          "https://www.nabdalqalam.com",
          "https://test.nabdalqalam.com",
          "https://www.test.nabdalqalam.com",
          "https://dashboard.nabdalqalam.com",
          "https://www.dashboard.nabdalqalam.com",
          "http://localhost:5173",
          "http://localhost:3000",
        ];

        // Allow any subdomain of nabdalqalam.com (for PR previews)
        if (
          origin &&
          /^https:\/\/[a-zA-Z0-9-]+\.nabdalqalam\.com$/.test(origin)
        ) {
          return true;
        }
        return allowed.includes(origin || "");
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  )
```

**Two non-negotiable rules:**

1. **`credentials: true`** — without this, the browser will **not** send cross-origin cookies even with `credentials: 'include'` on the fetch, AND the server will not emit `Access-Control-Allow-Credentials: true`. Cross-origin cookie flow (auth + `_fbp` fallback) silently dies.

2. **Reflected `Access-Control-Allow-Origin`** — when `credentials: true`, the spec **forbids** `Access-Control-Allow-Origin: *`. The origin must be echoed verbatim from the request. The function-based `origin` option does exactly that: it returns `true` for allowed origins (Elysia then reflects the request origin) and `false` otherwise.

The allowlist + regex combo lets you cover production, staging, dashboard, localhost, and any `*.nabdalqalam.com` PR-preview subdomain.

---

## 7. The `fbclid` → `_fbc` server-side capture (ITP resilience)

### Why `_fbc` matters and why client-side cookies fail

`_fbc` is the **click id** cookie. When a user lands from a Meta ad, the URL contains `?fbclid=...`; the Pixel's `fbevents.js` writes `_fbc = fb.1.<unix_ms>.<fbclid>` so every subsequent event can be attributed to that ad click. **Losing `_fbc` severs events from the ad click** → Meta's algorithm can't tell which ads drove conversions → optimization degrades, CPA climbs, lookalikes weaken.

Two problems with leaving `_fbc` purely to the browser:

- **Ad blockers** prevent `fbevents.js` from running at all → no `_fbc` ever written.
- **iOS Safari / ITP** caps JavaScript-written cookies to **7 days**. A user who clicks an ad, abandons, and returns 10 days later has lost `_fbc` → that purchase can't be attributed to the click.

### The server-side `onAfterHandle` hook

`source: backend/src/index.ts:63-98`

```ts
// Server-side `_fbc` persistence for ITP / ad-blocker resilience.
//
// When a user lands on the storefront from a Meta ad, the URL contains
// `?fbclid=...`. The browser Pixel normally writes `_fbc` from that, but:
//   - ad blockers prevent fbevents.js from running at all
//   - Safari ITP caps JS-written cookies to 7 days
// Both lose ad attribution for any CAPI event fired later (e.g. Purchase 3
// days after the click). This hook reconstructs `_fbc` server-side from the
// Referer's `fbclid` query param and persists it as a first-party HTTP
// cookie on the API host (immune to ITP's JS cap because it's set via
// Set-Cookie on the HTTP response). Subsequent cross-origin fetches with
// `credentials: 'include'` replay it, and `extractCapiContext` reads it.
//
// Only fires when no `_fbc` is already present so the canonical Pixel-set
// value always wins. Format mirrors `fbevents.js`: `fb.1.<unix_ms>.<fbclid>`.
.onAfterHandle(({ request, set }) => {
  const referer = request.headers.get("referer");
  if (!referer) return;
  let fbclid: string | null = null;
  try {
    fbclid = new URL(referer).searchParams.get("fbclid");
  } catch {
    return;
  }
  if (!fbclid) return;

  const cookieHeader = request.headers.get("cookie") || "";
  if (/(?:^|; )_fbc=/.test(cookieHeader)) return;

  const value = `fb.1.${Date.now()}.${fbclid}`;
  set.headers = set.headers ?? {};
  if (!set.headers["Set-Cookie"]) {
    set.headers["Set-Cookie"] =
      `_fbc=${value}; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=7776000`;
  }
})
```

**Key properties:**

- **First-party HTTP cookie** set via `Set-Cookie` on the API host — immune to ITP's 7-day JS-cookie cap because that cap only applies to cookies written by JavaScript.
- **`Max-Age=7776000`** = 90 days, matching Meta's attribution window.
- **`HttpOnly`** so it can't be read/tampered with by client JS (the client forwards it via the explicit `x-fbc` header instead — §5).
- **Only sets when `_fbc` is absent** — never overrides the canonical Pixel-written value.
- Format `fb.1.<unix_ms>.<fbclid>` mirrors exactly what `fbevents.js` writes, so Meta accepts it natively.

### The `fbcFromFbclid` referer fallback (belt + suspenders)

Even if the cookie was never set (e.g. user blocked cookies entirely), `extractCapiContext` synthesizes `_fbc` on-the-fly from the live Referer:

`source: backend/src/lib/facebook-capi.ts:438-459`

```ts
/**
 * Build a `_fbc`-style click id from a `fbclid` query param when the `_fbc`
 * cookie is absent (e.g. ATT/iOS Safari, or first-touch before the browser
 * Pixel has written `_fbc`). Format mirrors what `fbevents.js` writes:
 * `fb.1.<unix_ms>.<fbclid>`.
 *
 * We only synthesize when no canonical `_fbc` exists so we never override
 * the Pixel's own id. The referer on a cross-origin API call carries the
 * page URL (including `?fbclid=...` on ad landing), so this recovers ad
 * attribution that would otherwise be lost.
 */
function fbcFromFbclid(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    const fbclid = url.searchParams.get("fbclid");
    if (!fbclid) return undefined;
    return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    return undefined;
  }
}
```

Read order in `extractCapiContext` is **header → cookie → fbclid-from-referer**:

`source: backend/src/lib/facebook-capi.ts:486-490`

```ts
fbc:
  headers.get("x-fbc") ||
  parseCookie(cookieHeader, "_fbc") ||
  fbcFromFbclid(referer) ||
  undefined,
```

### Why `referrerPolicy: 'no-referrer-when-downgrade'` is required

Next.js's default `Referrer-Policy` for cross-origin fetches is `strict-origin-when-cross-origin`, which **strips the query string** from the Referer when the request goes to a different origin. That means `?fbclid=...` is gone before the backend ever sees it — both the `onAfterHandle` hook and `fbcFromFbclid` find nothing.

`source: client/services/cart/api.ts:27-30`

```ts
const baseOptions = (): RequestInit => ({
  credentials: 'include',
  referrerPolicy: 'no-referrer-when-downgrade',
});
```

`no-referrer-when-downgrade` keeps the full URL (including `?fbclid=`) on HTTPS→HTTPS cross-origin requests, which is exactly the storefront→API case. Apply it to every fetch to the API host.

---

## 8. CAPI core (backend) — step by step

### 8.1 `isCapiEnabled()` gating + Graph version pin

`source: backend/src/lib/facebook-capi.ts:18, 87-89`

```ts
const FB_GRAPH_VERSION = "v23.0";

// ...

export function isCapiEnabled(): boolean {
  return Boolean(process.env.FB_PIXEL_ID && process.env.FB_CAPI_ACCESS_TOKEN);
}
```

`sendCapiEvent` early-returns when disabled (`facebook-capi.ts:274-276`), and every `fire*` wrapper double-checks. **CAPI never throws into the request path.**

### 8.2 Types

`source: backend/src/lib/facebook-capi.ts:20-85`

```ts
export type CapiEventName =
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "ViewContent";

export type CapiItemType = "BOOK" | "COLLECTION" | "GAME";

export interface CapiContext {
  clientIpAddress?: string;
  clientUserAgent?: string;
  /** Browser ID cookie value (`_fbp`) for Pixel/CAPI deduplication. */
  fbp?: string;
  /** Click ID cookie value (`_fbc`) for ad attribution. */
  fbc?: string;
  /**
   * Client-generated event id forwarded via the `x-fb-event-id` header. When
   * present it MUST match the `eventID` used by the browser Pixel so Meta
   * deduplicates the browser + server events into one.
   */
  eventId?: string;
  /** Page URL the event originated from (Referer/Origin). Improves EMQ. */
  eventSourceUrl?: string;
}

export interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  /** Stable internal user id (hashed) — improves cross-device matching. */
  externalId?: string;
}

export interface CapiContentItem {
  id: string;
  quantity: number;
  item_price?: number;
}

export interface CapiOrderItem {
  itemId: string;
  itemType: CapiItemType;
  quantity: number;
  price: number;
}

export interface SendCapiEventOptions {
  eventName: CapiEventName;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentType?: string;
  contents?: CapiContentItem[];
  numItems?: number;
  orderId?: string;
  /** Shared id for deduplicating with the browser Pixel event. */
  eventId?: string;
  eventSourceUrl?: string;
  userData: CapiUserData;
  context?: CapiContext;
  /** Free-form label of the triggering flow, included in logs (no PII). */
  source?: string;
}
```

### 8.3 PII hashing + normalization

`source: backend/src/lib/facebook-capi.ts:91-114`

```ts
function sha256(value: string): string | undefined {
  if (!value) return undefined;
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

/**
 * Normalize a phone number to E.164-ish digits with a country code.
 * UAE-focused (store is UAE-only) but safe for other countries:
 *   "+971 50 123 4567" / "0097150..." -> "971501234567"
 *   "0501234567" (local)              -> "971501234567" (leading 0 dropped, 971 prefixed)
 *   "501234567"  (9 digits)           -> "971501234567"
 *   other country codes pass through unchanged.
 */
function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("971")) return p;
  if (p.startsWith("0")) return "971" + p.slice(1);
  if (p.length === 9) return "971" + p;
  return p;
}
```

**Rules:**

- **`sha256` lowercases + trims before hashing.** Email `"Foo@Example.com"` and `"foo@example.com"` must hash identically or Meta can't join them.
- **`normalizePhone` must be mirrored identically on the client** (§4.6). Any divergence = silent EMQ loss.
- **`normalizePhone` covers all the formats the store actually sees.** A UAE number like `0501234567` that slips through un-normalized is silently **dropped** by Meta → `ph` parameter lost → EMQ hit. The four branches above (`00…`, `+971`, `0…`, bare 9-digit) cover every realistic UAE input.

### 8.4 `buildUserData` — full hashed `user_data` construction

`source: backend/src/lib/facebook-capi.ts:218-255`

```ts
function buildUserData(
  userData: CapiUserData,
  context?: CapiContext,
): Record<string, string> {
  const data: Record<string, string> = {};

  const em = sha256(userData.email || "");
  if (em) data.em = em;

  const ph = sha256(normalizePhone(userData.phone || ""));
  if (ph) data.ph = ph;

  const fn = sha256(userData.firstName || "");
  if (fn) data.fn = fn;

  const ln = sha256(userData.lastName || "");
  if (ln) data.ln = ln;

  // Meta expects city with no spaces/punctuation.
  const cityRaw = (userData.city || "").replace(/[\s.,'-]/g, "");
  const ct = sha256(cityRaw);
  if (ct) data.ct = ct;

  const country = sha256(userData.country || "ae");
  if (country) data.country = country;

  const externalId = sha256(userData.externalId || "");
  if (externalId) data.external_id = externalId;

  if (context?.clientIpAddress)
    data.client_ip_address = context.clientIpAddress;
  if (context?.clientUserAgent)
    data.client_user_agent = context.clientUserAgent;
  if (context?.fbp) data.fbp = context.fbp;
  if (context?.fbc) data.fbc = context.fbc;

  return data;
}
```

**Parameter EMQ weight, highest → lowest:** `em` > `ph` > `external_id` > (`fbp` + `fbc` together) > (`client_ip_address` + `client_user_agent` together) > `fn`/`ln`/`ct`/`country`/`zp` (additive).

Notable details:

- **City punctuation stripped** before hashing — Meta requires it (e.g. `"Abu Dhabi"` → `"AbuDhabi"`).
- **`country` defaults to `"ae"`** (hashed) so even if the checkout form doesn't capture it, every event still gets a `country` value. For a non-UAE store, change this default.
- **`client_ip_address` + `client_user_agent` are required for `action_source: "website"`** — Meta rejects the event without them.

### 8.5 `toContentId` + `buildItemsPayload`

`source: backend/src/lib/facebook-capi.ts:116-131, 257-267`

```ts
/** Format used across the Pixel/catalog feed: `book_<id>`, `collection_<id>`. */
export function toContentId(itemType: CapiItemType, itemId: string): string {
  return `${itemType.toLowerCase()}_${itemId}`;
}

// ...

function buildItemsPayload(items: CapiOrderItem[]) {
  const contentIds = items.map((i) => toContentId(i.itemType, i.itemId));
  const contents: CapiContentItem[] = items.map((i) => ({
    id: toContentId(i.itemType, i.itemId),
    quantity: i.quantity,
    item_price: i.price,
  }));
  const numItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { contentIds, contents, numItems, value };
}
```

The `${type}_${id}` format MUST match the Pixel's `content_ids` exactly (§4.5) so Meta can correlate events with your Commerce Manager catalog.

### 8.6 `sendCapiEvent` — payload, URL, logging hygiene

`source: backend/src/lib/facebook-capi.ts:269-346`

```ts
/**
 * Send a single CAPI event. Never throws — all failures are logged so the
 * main request flow is never affected.
 */
export async function sendCapiEvent(
  options: SendCapiEventOptions,
): Promise<void> {
  if (!isCapiEnabled()) return;

  const pixelId = process.env.FB_PIXEL_ID!;
  const accessToken = process.env.FB_CAPI_ACCESS_TOKEN!;
  const testEventCode = process.env.FB_CAPI_TEST_EVENT_CODE;

  const { userData, context, ...rest } = options;

  const payload = {
    data: [
      {
        event_name: rest.eventName,
        event_time: Math.floor(Date.now() / 1000),
        ...(rest.eventId ? { event_id: rest.eventId } : {}),
        action_source: "website",
        event_source_url:
          rest.eventSourceUrl || context?.eventSourceUrl || undefined,
        user_data: buildUserData(userData, context),
        custom_data: {
          currency: rest.currency || "AED",
          value: rest.value,
          content_ids: rest.contentIds,
          content_type: rest.contentType || "product",
          contents: rest.contents,
          num_items: rest.numItems,
          ...(rest.orderId ? { order_id: rest.orderId } : {}),
        },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const testMode = Boolean(testEventCode);
  const logPrefix = `[CAPI] ${rest.eventName}`;
  const logMeta =
    `src=${rest.source || "-"} event_id=${rest.eventId || "-"} ` +
    `order=${rest.orderId || "-"} value=${rest.value ?? "-"} ` +
    `${rest.currency || "AED"} num_items=${rest.numItems ?? "-"} ` +
    `test=${testMode ? "yes" : "no"}`;

  console.log(`${logPrefix} → dispatching | ${logMeta}`);

  try {
    const url = `https://graph.facebook.com/${FB_GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      let traceId = res.headers.get("fbtrace_id") || "";
      try {
        const json: any = await res.json();
        traceId = traceId || json?.fbtrace_id || "";
      } catch {
        /* ignore json parse errors */
      }
      console.log(
        `${logPrefix} ✓ sent | http=${res.status} trace=${traceId || "-"} | ${logMeta}`,
      );
    } else {
      const body = await res.text();
      console.error(
        `${logPrefix} ✗ failed | http=${res.status} | ${logMeta} | response=${body}`,
      );
    }
  } catch (error) {
    console.error(`${logPrefix} ✗ error | ${logMeta} |`, error);
  }
}
```

**Payload shape (top-level):**

| Field | Required | Notes |
|---|---|---|
| `data[].event_name` | ✅ | One of `CapiEventName`. |
| `data[].event_time` | ✅ | Unix seconds. |
| `data[].event_id` | strongly recommended | The dedup id. Same as the browser Pixel's `{ eventID }`. |
| `data[].action_source` | ✅ | `"website"` for browser-sourced events. Requires `client_ip_address` + `client_user_agent`. |
| `data[].event_source_url` | recommended | Minor EMQ lift. |
| `data[].user_data` | ✅ | All PII hashed + normalized (§8.4). |
| `data[].custom_data` | for commerce | `currency`, `value`, `content_ids`, `content_type`, `contents`, `num_items`, optional `order_id`. |
| `test_event_code` | optional | Routes to Meta's Test Events dashboard instead of prod. |

**Logging hygiene rule (critical for privacy):**

> `logMeta` contains ONLY `src/event_id/order/value/currency/num_items/test`. NEVER log `userData`, NEVER log `email`/`phone`/`name`, NEVER log the full payload body. Hashed or not, treat PII as untouchable in logs.

**Never block the request flow:**

- The whole body is wrapped in `try/catch`.
- Every caller also appends `.catch()` (see §8.8, §10, §11) so an unhandled promise rejection can't propagate into a Stripe checkout response.
- Never place a CAPI call after an early `return`.

### 8.7 `extractCapiContext`

`source: backend/src/lib/facebook-capi.ts:429-496`

```ts
function parseCookie(
  cookieHeader: string | null,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]).trim() : undefined;
}

// ... fbcFromFbclid (see §7) ...

/**
 * Extract CAPI user context (client IP, user agent, and the `_fbp` / `_fbc`
 * browser identifiers) from an incoming request.
 *
 * The browser cookie identifiers are read from the Cookie header (sent when
 * the client calls the API with credentials) but can also be passed via the
 * `x-fbp` / `x-fbc` headers for cross-origin setups without cookies.
 */
export function extractCapiContext(request: Request): CapiContext {
  const headers = request.headers;
  const cookieHeader = headers.get("cookie");

  const forwardedFor = headers.get("x-forwarded-for");
  const clientIpAddress = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : headers.get("x-real-ip") || undefined;

  const referer = headers.get("referer") || undefined;
  const origin = headers.get("origin") || undefined;

  return {
    clientIpAddress,
    clientUserAgent: headers.get("user-agent") || undefined,
    fbp:
      headers.get("x-fbp") || parseCookie(cookieHeader, "_fbp") || undefined,
    fbc:
      headers.get("x-fbc") ||
      parseCookie(cookieHeader, "_fbc") ||
      fbcFromFbclid(referer) ||
      undefined,
    // Browser-generated event id shared with the Pixel for deduplication.
    eventId: headers.get("x-fb-event-id") || undefined,
    // Prefer the page URL (Referer); fall back to the API origin.
    eventSourceUrl: referer || origin || undefined,
  };
}
```

**Notes:**

- **IP** via `x-forwarded-for` (first hop) then `x-real-ip` — needed because Bun runs behind a proxy/load balancer that overwrites the socket peer.
- **`fbp`/`fbc`** read header-first (the cross-origin fix in §5), cookie-as-fallback, and `fbc` additionally falls back to synthesis from `fbclid` in the Referer (§7).
- **`eventId`** is the dedup id forwarded from the client's `x-fb-event-id` header.
- **`eventSourceUrl`** prefers Referer (full page URL) over Origin.

### 8.8 The `trackAddToCart` / `trackInitiateCheckout` / `trackPurchase` wrappers

`source: backend/src/lib/facebook-capi.ts:348-427`

```ts
/** Track AddToCart. `value` should be price * quantity for the added item. */
export function trackAddToCart(params: {
  itemId: string;
  itemType: CapiItemType;
  quantity: number;
  value: number;
  userData: CapiUserData;
  context?: CapiContext;
  eventId?: string;
}): Promise<void> {
  const contentId = toContentId(params.itemType, params.itemId);
  return sendCapiEvent({
    eventName: "AddToCart",
    value: params.value,
    currency: "AED",
    contentIds: [contentId],
    contents: [
      {
        id: contentId,
        quantity: params.quantity,
        item_price: params.value / Math.max(params.quantity, 1),
      },
    ],
    numItems: params.quantity,
    userData: params.userData,
    context: params.context,
    eventId: params.eventId,
  });
}

/** Track InitiateCheckout. `value` should be the order/cart total. */
export function trackInitiateCheckout(params: {
  items: CapiOrderItem[];
  value: number;
  orderId?: string;
  userData: CapiUserData;
  context?: CapiContext;
  eventId?: string;
}): Promise<void> {
  const { contentIds, contents, numItems } = buildItemsPayload(params.items);
  return sendCapiEvent({
    eventName: "InitiateCheckout",
    value: params.value,
    currency: "AED",
    contentIds,
    contents,
    numItems,
    orderId: params.orderId,
    userData: params.userData,
    context: params.context,
    eventId: params.eventId,
  });
}

/** Track Purchase. `value` should be the final order total paid. */
export function trackPurchase(params: {
  items: CapiOrderItem[];
  value: number;
  orderId?: string;
  userData: CapiUserData;
  context?: CapiContext;
  eventId?: string;
  /** Triggering flow label, e.g. "cod", "stripe-webhook", "stripe-verify", "tabby". */
  source?: string;
}): Promise<void> {
  const { contentIds, contents, numItems } = buildItemsPayload(params.items);
  return sendCapiEvent({
    eventName: "Purchase",
    value: params.value,
    currency: "AED",
    contentIds,
    contents,
    numItems,
    orderId: params.orderId,
    userData: params.userData,
    context: params.context,
    eventId: params.eventId,
    source: params.source,
  });
}
```

**The `eventId` parameter is the dedup link.** For AddToCart/InitiateCheckout, pass `capiCtx.eventId` (forwarded from the client). For Purchase, the wrapper that calls `trackPurchase` supplies the deterministic `purchase_<orderId>` (§9).

---

## 9. The dedup contract (the heart of it)

### The chain

```
generateEventId()  ──┬──▶  fbq('track', EVENT, customData, { eventID: id })
                     │
                     └──▶  fetch(API, { headers: { 'x-fb-event-id': id } })
                                                │
                                                ▼
                                  extractCapiContext(request).eventId = id
                                                │
                                                ▼
                                  trackX({ ..., eventId: id })
                                                │
                                                ▼
                                  sendCapiEvent payload: { event_id: id }
                                                │
                                                ▼
                                       Meta dedupes by
                                  (event_name, event_id)
                                       + matching fbp
                                            ▼
                                        ONE event
```

If **any** link is missing or mismatched by a single character, Meta keeps both events and you get duplicate conversions (inflated ROAS that collapses on reconciliation, audiences trained on noise).

### Purchase specifically: deterministic `purchase_<orderId>`

Purchase is special because the server-side event usually fires from an **async webhook** that has no idea what `event_id` the browser generated (the browser-side `fbq` Purchase on the success page wasn't necessarily told about the webhook's id). The solution: derive the id deterministically from the orderId so both sides compute the same string.

**Client:**

`source: client/lib/facebook-pixel.ts:256-279`

```ts
// Track successful purchase
export const purchase = (items: {...}[], totalValue: number, orderId?: string) => {
  // Deterministic id matching the backend's `purchase_<orderId>` so the browser
  // Pixel event and the server Conversions API event deduplicate to one.
  const eventId = orderId ? `purchase_${orderId}` : undefined;
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      // ... customData ...
      ...(orderId && { order_id: orderId }),
    }, eventId ? { eventID: eventId } : {});
  }
};
```

**Server (every Purchase path):**

`source: backend/src/modules/payment/service.ts:1251-1285`

```ts
private static async firePurchase(
  items: CapiOrderItem[],
  value: number,
  order: { id: string; /* ... */ },
  capiCtx?: CapiContext,
  source: string = "unknown",
) {
  if (!isCapiEnabled()) {
    console.log(`[CAPI] Purchase skipped (disabled) | src=${source} order=${order.id}`);
    return;
  }
  try {
    const userData = await resolveCapiUserDataFromOrder(order);
    trackPurchase({
      items,
      value,
      orderId: order.id,
      userData,
      context: capiCtx,
      // Deterministic id so the Stripe webhook + client verify call (and the
      // browser Pixel, if it also passes this id) deduplicate to one Purchase.
      eventId: `purchase_${order.id}`,
      source,
    }).catch((err) => console.error("CAPI Purchase error:", err));
  } catch (err) {
    console.error("CAPI Purchase error:", err);
  }
}
```

`firePurchase` is called from **four** paths, and they all use the same `purchase_${order.id}`:

| Path | Source label | File:line |
|---|---|---|
| Stripe client `verifyAndCompletePayment` | `"stripe-verify"` | `backend/src/modules/payment/service.ts:1123-1129` |
| Stripe webhook `handleCheckoutSessionCompleted` | `"stripe-webhook"` | `backend/src/modules/payment/service.ts:1001-1008` |
| COD confirm (`checkoutCOD` + `buyNowCOD`) | `"cod"` / `"cod-buynow"` | `backend/src/modules/payment/service.ts:634-640, 788-794` |
| Tabby `verifyAndCapture` | `"tabby"` | `backend/src/modules/payment/tabby-service.ts:757-777` |

Both Stripe paths firing Purchase is intentional — the webhook path is guarded by `wasAlreadySucceeded` (`service.ts:946, 1000`) so only the path that actually confirms payment fires, and even if both somehow fire, Meta dedupes via the matching `event_id`.

### The controller wiring

`source: backend/src/modules/payment/index.ts:15-31, 83-99, 151-167`

```ts
.post(
  "/checkout",
  async ({ body, user, status, request }) => {
    try {
      const result = await PaymentService.checkout(body, user?.id, extractCapiContext(request));
      return result;
    } catch (error) {
      // ...
    }
  },
  { body: PaymentModel.checkout }
)
// ...
.post(
  "/verify/:sessionId",
  async ({ params, status, request }) => {
    try {
      const result = await PaymentService.verifyAndCompletePayment(
        params.sessionId,
        extractCapiContext(request),
      );
      // ...
    }
  }
)
```

Every controller handler calls `extractCapiContext(request)` and threads the result into the service method. The service then either passes it to `trackX` directly (for synchronous events like InitiateCheckout) or persists it onto Stripe metadata / `Order.capiContext` (for async webhook events — §10).

---

## 10. The async-webhook context-loss problem + solution

### Why this is the #1 cause of "Purchase EMQ < InitiateCheckout EMQ"

When Stripe or Tabby calls **your** webhook, that request originates from *their* servers, not the user's browser. It carries:

- ❌ No browser cookies (no `_fbp`, no `_fbc`)
- ❌ No user IP / UA
- ❌ No Referer/page URL

If your webhook handler calls `trackPurchase` with no context, the Purchase event goes to Meta with **no `fbp`/`fbc`/IP/UA** — even though the InitiateCheckout event (which fired from the browser-sync checkout-creation request) had all of them. The result is **Purchase EMQ lower than InitiateCheckout EMQ** — a violation of the funnel monotonicity rule (deeper funnel steps should collect MORE data, not less).

### The solution: persist the browser context at checkout creation, rehydrate at webhook time

At **checkout creation** (a browser-sourced request), stash `capiCtx` into the Stripe session `metadata` (Stripe path) or the `Order.capiContext` JSON column (Tabby path). At **webhook time**, reconstruct the context from that persisted state.

#### Stripe path

`source: backend/src/modules/payment/service.ts:1207-1218`

```ts
/** Flatten the CAPI context onto Stripe session metadata for webhook reuse. */
private static capiMetadataFields(capiCtx?: CapiContext): Record<string, string> {
  if (!capiCtx) return {};
  const fields: Record<string, string> = {};
  if (capiCtx.clientIpAddress) fields.capi_ip = capiCtx.clientIpAddress;
  if (capiCtx.clientUserAgent)
    fields.capi_ua = capiCtx.clientUserAgent.slice(0, 490);
  if (capiCtx.fbp) fields.capi_fbp = capiCtx.fbp;
  if (capiCtx.fbc) fields.capi_fbc = capiCtx.fbc;
  if (capiCtx.eventSourceUrl) fields.capi_url = capiCtx.eventSourceUrl;
  return fields;
}
```

> `capi_ua` is sliced to 490 chars because Stripe metadata values are capped at 500 chars and some UAs are long.

Spread into Stripe session creation:

`source: backend/src/modules/payment/service.ts:223-238`

```ts
const sessionParams: Stripe.Checkout.SessionCreateParams = {
  payment_method_types: ["card"],
  line_items: lineItems,
  mode: "payment",
  success_url: data.successUrl,
  cancel_url: data.cancelUrl,
  ...(customerEmail ? { customer_email: customerEmail } : {}),
  metadata: {
    orderId: order.id,
    userId: userId || "",
    couponCode: data.couponCode || "",
    couponDiscount: couponDiscount.toString(),
    shippingCost: shippingCost.toString(),
    ...this.capiMetadataFields(capiCtx),              // ← round-trip CAPI context
  },
};
```

Rehydrate at webhook time:

`source: backend/src/modules/payment/service.ts:1188-1205`

```ts
/**
 * Reconstruct the CAPI request context stored on the Stripe checkout session
 * metadata (set at checkout time). The Stripe webhook has no client request,
 * so without this the webhook-sourced Purchase event would lack IP/UA/fbp/fbc
 * and match poorly.
 */
private static capiContextFromStripeMetadata(
  session: Stripe.Checkout.Session,
): CapiContext | undefined {
  const m = session.metadata as Record<string, string> | null;
  if (!m) return undefined;
  return capiContextFromRecord({
    fbp: m.capi_fbp,
    fbc: m.capi_fbc,
    clientIpAddress: m.capi_ip,
    clientUserAgent: m.capi_ua,
    eventSourceUrl: m.capi_url,
  });
}
```

Used by the webhook Purchase:

`source: backend/src/modules/payment/service.ts:1000-1008`

```ts
if (!wasAlreadySucceeded) {
  this.firePurchase(
    buildCapiItems(order.items as any),
    Number(order.total),
    order,
    this.capiContextFromStripeMetadata(session),          // ← persisted context
    "stripe-webhook",
  );
}
```

#### Tabby path (persisted-first, live-fallback)

Tabby verify can be called from either the browser (success redirect) or the Tabby webhook. The pattern is **persisted-first / live-fallback**:

`source: backend/src/modules/payment/tabby-service.ts:324-339` — persist at checkout creation:

```ts
await prisma.order.update({
  where: { id: order.id },
  data: {
    tabbyPaymentId: session.payment.id,
    ...(capiCtx
      ? {
          capiContext: {
            fbp: capiCtx.fbp,
            fbc: capiCtx.fbc,
            clientIpAddress: capiCtx.clientIpAddress,
            clientUserAgent: capiCtx.clientUserAgent,
          },
        }
      : {}),
  },
});
```

`source: backend/src/modules/payment/tabby-service.ts:603-624` — rehydrate at verify:

```ts
// Prefer the persisted browser context (captured at checkout creation)
// over the live request: when this runs from the Tabby webhook, the
// incoming request originates from Tabby's servers and carries none of
// the user's fbp/fbc/IP/UA. Fall back to live capiCtx only when called
// from the browser verify path AND no context was persisted.
const persistedCtx = capiContextFromOrder(order);
const effectiveCtx = persistedCtx ?? capiCtx;

// `order.user` is eager-loaded via Prisma `include`; pass it through so
// resolveCapiUserDataFromOrder doesn't need a redundant user lookup.
const purchaseUserData = await resolveCapiUserDataFromOrder(order, {
  user: order.user,
});

// Track Purchase via Facebook Conversions API
this.firePurchase(
  buildCapiItems(updatedOrder.items as any),
  Number(order.total),
  order.id,
  purchaseUserData,
  effectiveCtx,
);
```

The helpers backing both paths:

`source: backend/src/lib/facebook-capi.ts:184-216`

```ts
/**
 * Build a `CapiContext` from any record-shaped source carrying the four
 * browser-linking fields (`fbp`, `fbc`, `clientIpAddress`, `clientUserAgent`).
 * Returns `undefined` when none are present. Used by Stripe metadata and
 * Order.capiContext reconstruction.
 */
export function capiContextFromRecord(rec: {
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  eventSourceUrl?: string | null;
} | null | undefined): CapiContext | undefined {
  if (!rec || typeof rec !== "object") return undefined;
  const has = Boolean(
    rec.fbp || rec.fbc || rec.clientIpAddress || rec.clientUserAgent || rec.eventSourceUrl,
  );
  if (!has) return undefined;
  return {
    fbp: rec.fbp || undefined,
    fbc: rec.fbc || undefined,
    clientIpAddress: rec.clientIpAddress || undefined,
    clientUserAgent: rec.clientUserAgent || undefined,
    eventSourceUrl: rec.eventSourceUrl || undefined,
  };
}

/** Reconstruct a `CapiContext` from the persisted `Order.capiContext` JSON column. */
export function capiContextFromOrder(order: {
  capiContext?: any;
}): CapiContext | undefined {
  return capiContextFromRecord(order.capiContext);
}
```

### Don't forget `event_source_url` round-trip

`event_source_url` is a minor-but-real EMQ input. Persist `capiCtx.eventSourceUrl` into Stripe metadata as `capi_url` (shown above) and rehydrate it in `capiContextFromStripeMetadata`. Without this, webhook-sourced Purchases ship with no page URL.

---

## 11. AddToCart CAPI userData — send everything you have

`ph` (hashed phone) is the **second-strongest** EMQ parameter after `em`. The logged-in user's phone and name are already on the request context (via `requireAuth` middleware) — pass them all into `userData`, not just `email`.

`source: backend/src/modules/cart/index.ts:19-60`

```ts
.post(
  "/items",
  async ({ body, user, status, request }) => {
    try {
      const item = await CartService.addItem(user!.id, body);

      if (isCapiEnabled()) {
        const resolvedItem = item.item as { price?: unknown } | null;
        const price = Number(resolvedItem?.price || 0);
        const capiCtx = extractCapiContext(request);
        trackAddToCart({
          itemId: item.itemId,
          itemType: item.itemType as "BOOK" | "COLLECTION" | "GAME",
          quantity: item.quantity,
          value: price * item.quantity,
          userData: {
            email: user!.email,
            phone: user!.phone || undefined,
            firstName: user!.name || undefined,
            externalId: user!.id,
          },
          context: capiCtx,
          // Share the browser Pixel's event id for Pixel<->CAPI deduplication.
          eventId: capiCtx.eventId,
        }).catch((err) => console.error("CAPI AddToCart error:", err));
      }

      return status(201, item);
    } catch (error: any) {
      // ...
    }
  },
  { body: CartModel.addItem }
)
```

**Notes:**

- `trackAddToCart` is wrapped in `isCapiEnabled()` AND `.catch()` — double protection against breaking the cart response.
- `eventId: capiCtx.eventId` is forwarded from the client's `x-fb-event-id` header (the dedup link).
- `value` is `price * quantity` (the line total), matching the browser's `addBookToCart` `value` exactly.

---

## 12. Buy Now / guest PII forwarding

Guest checkout forms capture name/phone/address/city. Those fields MUST round-trip from the checkout form → API body → `Order` row so that `resolveCapiUserDataFromOrder` can produce `ph`/`ct`/`fn`/`ln` for the Purchase event. Otherwise a guest Purchase ships with only `em` (or nothing), breaking funnel monotonicity.

### Persist all guest fields on order creation

`source: backend/src/modules/payment/service.ts:145-171` (cart-based Stripe checkout)

```ts
const order = await prisma.order.create({
  data: {
    ...(userId ? { userId } : {}),
    guestEmail: !userId ? (data.guestEmail || null) : null,
    guestName: data.guestName || null,
    guestPhone: data.guestPhone || null,
    shippingAddress: data.shippingAddress || null,
    shippingCity: data.shippingCity || null,
    total,
    items: { create: [ /* ... */ ] },
  },
  include: { items: true },
});
```

The same pattern applies in `buyNow`, `checkoutCOD`, `buyNowCOD`, and both Tabby paths. **Never create an Order without persisting all guest PII fields** — every CAPI event downstream depends on them.

### `resolveCapiUserDataFromOrder` — turn the order row into `CapiUserData`

`source: backend/src/lib/facebook-capi.ts:133-182`

```ts
/**
 * Resolve `user_data` PII for a CAPI event from an Order row. Prefer the
 * guest fields captured at checkout; fall back to a User lookup by `userId`
 * for `email` / `phone` / `name` / `externalId`. Splits a full name into
 * first/last for better Meta matching. Never throws.
 *
 * Pass `options.user` when the User record is already loaded (e.g. via Prisma
 * `include: { user: true }`) to skip the extra `prisma.user.findUnique`.
 */
export async function resolveCapiUserDataFromOrder(
  order: {
    userId?: string | null;
    guestEmail?: string | null;
    guestName?: string | null;
    guestPhone?: string | null;
    shippingCity?: string | null;
  },
  options?: {
    user?: { email?: string | null; name?: string | null; phone?: string | null } | null;
  },
): Promise<CapiUserData> {
  let email = order.guestEmail || undefined;
  let phone = order.guestPhone || undefined;
  let firstName = order.guestName || undefined;
  let lastName: string | undefined;
  const city = order.shippingCity || undefined;
  let externalId: string | undefined;

  if (!email && order.userId) {
    let user = options?.user;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { email: true, name: true, phone: true },
      });
    }
    email = user?.email || undefined;
    phone = phone || user?.phone || undefined;
    firstName = firstName || user?.name || undefined;
    externalId = order.userId;
  }

  if (firstName && firstName.trim().includes(" ")) {
    const parts = firstName.trim().split(/\s+/);
    lastName = parts.pop();
    firstName = parts.join(" ");
  }

  return { email, phone, firstName, lastName, city, externalId };
}
```

**Why split first/last:** Meta's `fn`/`ln` are separate fields. Shipping only `fn` with a full name like `"Ahmed Al-Mansoori"` loses the `ln` signal entirely. The split gives Meta both.

**Why pass `options.user`:** when the caller has already eager-loaded the user via Prisma `include: { user: true }` (as Tabby does at `tabby-service.ts:536`), this skips a redundant DB hit.

---

## 13. Retry-payment path

When a customer retries a failed/expired payment via `/payment/create-checkout-session`, the new Stripe session needs the same CAPI treatment as the original checkout: thread in `extractCapiContext`, persist `capiMetadataFields`, and fire `InitiateCheckout`. Otherwise the retry's eventual webhook Purchase ships with no context and matches poorly — dragging aggregate Purchase EMQ down.

`source: backend/src/modules/payment/index.ts:83-99`

```ts
.post(
  "/create-checkout-session",
  async ({ body, status, request }) => {
    try {
      const session = await PaymentService.createCheckoutSession(body, extractCapiContext(request));
      return session;
    } catch (error) {
      // ...
    }
  },
  { body: PaymentModel.createCheckoutSession }
)
```

`source: backend/src/modules/payment/service.ts:859-898`

```ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: lineItems,
  mode: "payment",
  success_url: data.successUrl,
  cancel_url: data.cancelUrl,
  ...(order.user?.email ? { customer_email: order.user.email } : order.guestEmail ? { customer_email: order.guestEmail } : {}),
  metadata: {
    orderId: order.id,
    userId: order.userId || "",
    ...this.capiMetadataFields(capiCtx),              // ← round-trip CAPI context
  },
});

await prisma.order.update({
  where: { id: order.id },
  data: {
    stripeSessionId: session.id,
    paymentStatus: "PROCESSING",
  },
});

this.fireInitiateCheckout(
  buildCapiItems(order.items.map((i) => ({
    itemId: i.itemId,
    itemType: i.itemType,
    quantity: i.quantity,
    price: i.price,
  }))),
  Number(order.total),
  order,
  capiCtx,
);
```

---

## 14. Test event code + production guards

`FB_CAPI_TEST_EVENT_CODE` is a code from Meta Events Manager ("Test Events" tab) that routes your server events to the **test pipeline only**. It's essential during validation, catastrophic if accidentally set in production: the prod dashboard drops to ~0 with no error.

`source: backend/src/index.ts:27-31`

```ts
if (process.env.NODE_ENV === "production" && process.env.FB_CAPI_TEST_EVENT_CODE) {
  console.warn(
    "[CAPI] WARNING: FB_CAPI_TEST_EVENT_CODE is set in production — all server events will route to Meta's TEST pipeline only and will NOT appear in the production Events Manager dashboard.",
  );
}
```

**Rules:**

- Set `FB_CAPI_TEST_EVENT_CODE` **only** in non-prod env during validation.
- Leave it empty (`""`) in production — see `backend/.env.example:53`.
- The boot-time warning catches accidental prod commits; consider failing the boot entirely if you want hard enforcement.

---

## 15. Verification checklist

Port this to the new project. Each row is something you should be able to verify in code AND see reflected in Events Manager.

### Cross-origin identity (the big one)

- [ ] Every `fetch` to the API host includes `credentials: 'include'` (so target-origin cookies + auth round-trip).
- [ ] Every `fetch` to the API host includes `referrerPolicy: 'no-referrer-when-downgrade'` (so `?fbclid=` survives into the Referer).
- [ ] Every `fetch` to the API host spreads `capiHeaders()` (sends `x-fbp` / `x-fbc`).
- [ ] Backend CORS sets `credentials: true` AND uses a function-based reflected origin (never `*`).
- [ ] `extractCapiContext` reads `fbp`/`fbc` from header first, cookie as fallback.
- [ ] `onAfterHandle` hook captures `fbclid` from Referer and sets first-party `_fbc` cookie.
- [ ] `fbcFromFbclid` synthesizes `_fbc` from Referer as a last-resort fallback.

### Dedup

- [ ] Client `generateEventId()` once per action → forwarded to BOTH `fbq(..., { eventID })` AND `x-fb-event-id` header.
- [ ] AddToCart, InitiateCheckout share ONE event_id client→server.
- [ ] Purchase uses canonical `purchase_<orderId>` across **every** server path (Stripe verify, Stripe webhook, Tabby verify, COD) AND the client `purchase()` helper.
- [ ] The client `purchase(items, total, orderId)` is called with the real orderId from the success page (not a fresh `generateEventId()`).

### Webhook context round-trip

- [ ] Stripe session `metadata` carries `capi_fbp`/`capi_fbc`/`capi_ip`/`capi_ua`/`capi_url` (via `capiMetadataFields`).
- [ ] Webhook Purchase uses `capiContextFromStripeMetadata(session)` to rehydrate.
- [ ] Tabby persists `capiContext` to `Order.capiContext` JSON column; verify uses persisted-first/live-fallback.
- [ ] `event_source_url` round-trips (don't forget `capi_url`).

### Data quality

- [ ] `value` is the **final paid total** (post-discount, post-shipping) for Purchase; line totals for AddToCart/InitiateCheckout.
- [ ] `value` matches between Pixel and CAPI for the same `event_id`.
- [ ] `content_id` format is `${type}_${id}` on both sides (matches catalog feed).
- [ ] `currency` is the campaign currency everywhere (AED here).
- [ ] PII hashed (SHA-256 of lowercased+trimmed) and phone normalized identically on client + server.
- [ ] City stripped of spaces/punctuation before hashing.
- [ ] `country` defaults to your store's country (here `ae`).

### Hygiene & resilience

- [ ] No PII in logs — only `src/event_id/order/value/currency/num_items/test`.
- [ ] `FacebookPixel.tsx` returns `null` when `FB_PIXEL_ID` is unset; no hardcoded prod fallback.
- [ ] PageView fires on every SPA navigation (`usePathname()` effect).
- [ ] `isCapiEnabled()` gates every `track*` call; CAPI is a no-op when env is missing.
- [ ] Every `track*` call is `.catch()`-ed or wrapped in try/catch; never placed after a `return`.
- [ ] `FB_CAPI_TEST_EVENT_CODE` unset in production; boot-time warning in place.
- [ ] Graph API version pinned once (`v23.0` today).

### Verify in Events Manager after deploying

- [ ] For each event, "Browser" + "Server" counts sum to roughly the dedup'd total (one isn't ~0).
- [ ] "Deduplicated" ratio is high (>80% on Purchase).
- [ ] EMQ is **non-decreasing down the funnel**: `ViewContent <= AddToCart <= InitiateCheckout <= Purchase`. If Purchase < InitiateCheckout, re-check §10 (webhook context round-trip).
- [ ] Server count > 0 for events with a CAPI track call (if ~0, check `isCapiEnabled()` / access token / network egress).
- [ ] Purchase server events carry `em`/`ph`/`fbp`/`fbc` (visible in Events Manager > event > "Server" > sample payload).

---

## 16. Tricks & enhancements summary

The non-obvious wins, one line each:

- **`x-fbp` / `x-fbc` headers beat cross-origin host-only cookies** — the storefront can read its own `_fbp`/`_fbc` and lift them into headers that cross origins freely. (§5)
- **Server-side first-party `_fbc` cookie beats iOS ITP** — `Set-Cookie` from the API host isn't subject to ITP's 7-day JS-cookie cap; survives 90 days. (§7)
- **`referrerPolicy: 'no-referrer-when-downgrade'` keeps `fbclid` in the Referer** — Next.js's default `strict-origin-when-cross-origin` strips the query string on cross-origin calls, silently killing fbclid capture. (§5, §7)
- **Deterministic `purchase_<orderId>` event_id across every path** — both browser and every server path (Stripe verify, Stripe webhook, Tabby, COD) compute the same string, so dedup survives even when the paths race. (§9)
- **Stripe-metadata round-trip solves the webhook EMQ cliff** — persist `fbp`/`fbc`/`IP`/`UA`/`URL` at checkout creation, rehydrate at webhook time. This is the #1 fix for "Purchase EMQ < InitiateCheckout EMQ". (§10)
- **Browser Advanced Matching + server hashing use the SAME normalization** — mirror `normalizePhone` byte-for-byte on client and server, or hashed `ph` diverges and Meta drops it. (§4.6, §8.3)
- **SPA PageView via `usePathname()`** — without it, Meta sees exactly one PageView per session and retargeting audiences break. (§4.2)
- **Empty-ID guard + no hardcoded prod fallback** — no env var ⇒ no pixel; prevents dev/preview traffic from contaminating prod audiences. (§4.3)
- **`isCapiEnabled` no-op gating + `.catch()` everywhere** — CAPI never breaks checkout. The worst case is "no server events", never "broken payment". (§8.1, §8.6)
- **Log hygiene** — log only `src/event_id/order/value/currency/num_items/test`; never PII. (§8.6)
- **Send ALL available `userData`, not just email** — `ph` is the 2nd-strongest EMQ param; if you have the user's phone/name/id, pass them. (§11)
- **Persist ALL guest PII on order creation** — guest `name`/`phone`/`city` round-trip into the Order row so `resolveCapiUserDataFromOrder` can produce `ph`/`ct`/`fn`/`ln`. (§12)
- **Split full names into first/last** — Meta has separate `fn`/`ln` fields; shipping a full name in `fn` loses the `ln` signal. (§12)
- **Thread `extractCapiContext(request)` into EVERY payment service method** — including retry-payment. Skipping one path creates a worst-EMQ event class. (§9, §13)
- **`wasAlreadySucceeded` guard on the Stripe webhook** — prevents duplicate Purchase even when both verify and webhook fire. (§9)
- **`event_source_url` round-trip via `capi_url`** — minor EMQ lift but free; don't forget it in the metadata. (§10)

---

## 17. UAE / store-specific porting notes

This codebase is a UAE-only bookstore in AED. When porting, change these:

1. **`normalizePhone` country rules** (`client/lib/facebook-pixel.ts:35-43` and `backend/src/lib/facebook-capi.ts:106-114`).
   - Currently hardcodes UAE: strips `00`, prefixes `971` for `0…` and bare 9-digit inputs.
   - For another country, replace `971` with your country code and tune the length heuristic (UAE mobiles are 9 digits after the leading 0; your country may differ).
   - For multi-country stores, derive the country code from the shipping address / locale and **share the exact same logic on client + server**.

2. **Currency everywhere** — replace `'AED'` / `"AED"` / `"aed"` with your currency. It appears in: every browser helper (`client/lib/facebook-pixel.ts`), every `trackX` wrapper default (`backend/src/lib/facebook-capi.ts`), Stripe `unit_amount` currency (`backend/src/modules/payment/service.ts:197,213,369,385,849`), Tabby payload (`tabby-service.ts:147`), and the `country` default in `buildUserData`.

3. **`content_id` scheme** (`book_<id>` / `collection_<id>` / `game_<id>`) — this store has three product types. Your catalog may have one or many. Pick a `${type}_${id}` convention that matches your **Commerce Manager product feed `id`** column exactly, then use the same string in both `toContentId` (`backend/src/lib/facebook-capi.ts:117-119`) and every browser helper's `content_ids` array.

4. **`country` default** in `buildUserData` (`backend/src/lib/facebook-capi.ts:241`) is `"ae"`. Change to your ISO-2 country code, or derive from the shipping address.

5. **CORS allowlist + regex** (`backend/src/index.ts:36-58`) hardcodes `nabdalqalam.com`. Replace with your domain.

6. **`ViewContent` is browser-only** in this repo (no `trackViewContent` helper). The `CapiEventName` union includes `"ViewContent"` (`facebook-capi.ts:24`) so adding it is cheap if any campaign optimizes on ViewContent — see audit finding F7 for the pattern.

7. **Consent gating** — this store fires Pixel/CAPI unconditionally because it's UAE-only (no GDPR). If you expand to consent-required regions, gate the Pixel loader and CAPI calls behind a consent check before firing.

---

*End of guide.*
