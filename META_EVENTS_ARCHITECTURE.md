# Meta Pixel + Conversions API — Architecture Guide

## Overview

This system tracks user behavior across the storefront using **two parallel channels** for every key event:

1. **Facebook Pixel (client-side)** — browser-based `fbq()` calls via the Meta Pixel SDK
2. **Meta Conversions API (server-side)** — `POST` requests to the Graph API from the backend

Both channels send the same `event_id` for deduplication, so Meta counts each event only once.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER / BROWSER                          │
│                                                             │
│  ┌──────────────┐    ┌────────────────┐                     │
│  │ Facebook      │    │ analytics.ts   │                     │
│  │ Pixel SDK     │◄───│ (track* fn's)  │                     │
│  │ (fbq calls)   │    └───────┬────────┘                     │
│  └──────┬───────┘             │                              │
│         │                     ▼                              │
│         │           ┌──────────────────┐                     │
│         │           │ Backend API      │                     │
│         │           │ /api/analytics   │ (internal storage)  │
│         │           └──────────────────┘                     │
│         │                                                    │
│         │           ┌──────────────────┐                     │
│         │           │ Backend API      │                     │
│         │           │ /api/contact     │                     │
│         │           │ /api/orders      │                     │
│         │           │ /api/payments    │                     │
│         │           └────────┬─────────┘                     │
└─────────┼──────────────────┼────────────────────────────────┘
          │                  │
          ▼                  ▼
   ┌──────────────┐   ┌──────────────┐
   │ Meta Pixel   │   │ Meta CAPI    │
   │ (browser)    │   │ (server)     │
   │              │   │              │
   │ fbq('track', │   │ sendMetaEvent│
   │  'Purchase', │   │ ({ eventName:│
   │  data,       │   │  'Purchase', │
   │  {eventID})  │   │  eventId})   │
   └──────┬───────┘   └──────┬───────┘
          │                  │
          └───────┬──────────┘
                  ▼
         ┌─────────────────┐
         │ Meta Events      │
         │ Manager           │
         │                   │
         │ Deduplicates by   │
         │ event_id          │
         └─────────────────┘
```

---

## File Structure

### Frontend (Next.js — `apps/marketing/src/`)

| File | Purpose |
|---|---|
| `components/analytics/facebook-pixel.tsx` | Loads the Meta Pixel SDK (`fbq` init + initial PageView) |
| `components/analytics/page-view-tracker.tsx` | Fires `PageView` on every SPA route change |
| `lib/facebook-pixel.ts` | Typed wrappers around `fbq()` — one function per standard event |
| `lib/analytics.ts` | Unified `track*()` functions that call both pixel + backend analytics API |

### Backend (Elysia — `apps/backend/src/`)

| File | Purpose |
|---|---|
| `lib/meta-capi.ts` | `sendMetaEvent()` — SHA256 hashes user data, POSTs to Graph API |
| `modules/contact/index.ts` | `POST /api/contact` — sends Lead event via CAPI + email notification |
| `modules/order/service.ts` | `create()` — sends Purchase CAPI event for COD orders |
| `modules/payment/service.ts` | `handlePaymentCompleted()` — sends Purchase CAPI event for Ziina orders |

---

## Event Coverage Matrix

| # | Meta Event | Frontend (Pixel) | Backend (CAPI) | Dedup eventId | Trigger |
|---|---|---|---|---|---|
| 1 | **PageView** | `PageViewTracker` on every route change | — | — | SPA navigation |
| 2 | **ViewContent** (product) | Product page `useEffect` | — | — | Product page loads |
| 3 | **ViewContent** (category) | Collection page `useEffect` | — | — | Collection page loads |
| 4 | **Search** | `global-search.tsx` + `search-overlay.tsx` + `use-collection-search.ts` | — | — | User searches (debounced, once per unique query) |
| 5 | **AddToCart** | Product card quick-add + Product page button + QuickView modal | — | — | User adds item to cart |
| 6 | **RemoveFromCart** | Cart drawer remove button | — | — | User removes item |
| 7 | **AddToWishlist** | Product page wishlist button | — | — | User adds to wishlist |
| 8 | **InitiateCheckout** | Checkout page `useEffect` | — | — | Checkout page loads |
| 9 | **AddPaymentInfo** | Checkout `useEffect` on payment method change | — | — | User selects payment method |
| 10 | **Purchase** (COD) | `checkout/client.tsx` with `eventID: order_<id>` | `order/service.ts` with `eventId: order_<id>` | `order_<id>` | COD order placed |
| 11 | **Purchase** (Ziina) | — (user leaves site) | `payment/service.ts` with `eventId: order_<id>` | `order_<id>` | Ziina webhook confirms payment |
| 12 | **CompleteRegistration** | `auth-context.tsx` with `eventID: register_<uid>_<ts>` | `auth/index.ts` with `eventId: register_<uid>_<ts>` | `register_<uid>_<ts>` | New user registers |
| 13 | **Lead** | `use-contact-form.ts` with `eventID: lead_<email>_<ts>` | `contact/index.ts` with `eventId: lead_<email>_<ts>` | `lead_<email>_<ts>` | Contact form submitted |
| 14 | **RemoveFromCart** (custom) | `cart-item-row.tsx` | — | — | User removes from cart |
| 15 | **Checkout abandon** (custom) | `cancel/cancel-tracker.tsx` | — | — | User cancels payment |

---

## How Each Event Flows

### 1. PageView (SPA Navigation)

```
User navigates → PageViewTracker (useEffect on pathname/searchParams)
                → fbPageView()
                → fbq('track', 'PageView')
```

### 2. ViewContent (Product Page)

```
Product page loads → useEffect fires once (guarded by hasTrackedView ref)
                   → trackProductView(id, slug, name, price)
                     ├── fbViewContent({ contentId, contentName, value })
                     └── POST /api/analytics/track/product-view
```

### 3. Search

```
User types in search → debounce 300ms → React Query fetches results
                    → trackedQueries ref prevents duplicates
                    → trackSearch(query, count, ids)
                      ├── fbSearch({ searchString, contentIds })
                      └── POST /api/analytics/track/search
```

### 4. AddToCart

```
User clicks "Add to Cart" → handleAddToCart()
                          → trackQuickAddToCart(productId, variantId, name, price, qty)
                            ├── fbAddToCart({ contentId, value, currency: "AED" })
                            └── POST /api/analytics/track/cart-add
```

### 5. Purchase (COD) — Dual Channel with Deduplication

```
Frontend:                              Backend:
Checkout form submitted                OrderService.create()
  → orderSuccess = true                  → Prisma creates order
  → useEffect fires                      → EmailService sends notification
  → trackOrderComplete(orderId, total)    → sendMetaEvent({
    → fbPurchase({                          eventName: "Purchase",
        orderId,                            eventId: `order_${order.id}`,
        value: total,                       email, phone, firstName, lastName,
        currency: "AED"                     value: order.total,
      }, {                                  currency: "AED"
        eventID: `order_${orderId}`       })
      })                                 → POST graph.facebook.com/.../events
  → fbq('track', 'Purchase', data)
```

**Meta receives both events with the same `event_id` and deduplicates them.**

### 6. Purchase (Ziina Online Payment)

```
Frontend: user is redirected to Ziina → no pixel event (user left site)

Backend:
Ziina webhook → PaymentService.handleWebhook()
             → PaymentService.handlePaymentCompleted()
               → Verify signature + IP
               → Decrement stock
               → Update order status to CONFIRMED
               → EmailService (owner + customer emails)
               → sendMetaEvent({
                   eventName: "Purchase",
                   eventId: `order_${order.id}`,
                   email, phone, firstName, lastName,
                   value, currency: "AED"
                 })
```

### 7. CompleteRegistration

```
User submits signup form → auth-context.tsx signUp()
                        → API call succeeds
                        → fbCompleteRegistration()
                        → fbq('track', 'CompleteRegistration', { currency: "AED" })
```

### 8. Lead (Contact Form) — Dual Channel

```
Frontend:                              Backend:
Contact form submitted                 POST /api/contact
  → fetch('/api/contact')               → EmailService.sendContactNotification()
  → fbLead()                             → sendMetaEvent({
  → fbq('track', 'Lead')                    eventName: "Lead",
                                             email, phone, firstName, lastName,
                                             userAgent, ip
                                           })
```

### 9. AddPaymentInfo

```
User selects payment method → formState.paymentMethod changes
                           → useEffect fires
                           → fbAddPaymentInfo({ contentIds, value, currency: "AED" })
                           → fbq('track', 'AddPaymentInfo', ...)
```

---

## Conversions API — Data Sent

The server-side events send **hashed user data** for better match quality:

| Field | Hash | Source |
|---|---|---|
| `em` (email) | SHA256 | `order.user.email` or `order.guestEmail` |
| `ph` (phone) | SHA256 | `order.user.phone` or `order.guestPhone` |
| `fn` (first name) | SHA256 | User or guest first name |
| `ln` (last name) | SHA256 | User or guest last name |
| `client_ip_address` | plain | `x-forwarded-for` or `x-real-ip` header |
| `client_user_agent` | plain | `user-agent` header |

**More matching data = better event quality score = better ad optimization.**

---

## Environment Variables

### Backend

| Variable | Purpose | Required |
|---|---|---|
| `META_PIXEL_ID` | Your Meta Pixel ID | Yes |
| `META_ACCESS_TOKEN` | Graph API access token | Yes |
| `MAILTRAP_TOKEN` | Mailtrap API token | Yes (for emails) |
| `MAILTRAP_SENDER_EMAIL` | Sender email | Default: `hello@capellauae.com` |
| `MAILTRAP_OWNERS` | Comma-separated owner emails | Yes (for notifications) |

### Frontend

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Pixel ID for browser SDK | Yes |
| `NEXT_PUBLIC_API_URL` | Backend URL | Yes |

---

## Key Implementation Patterns

### 1. Deduplication

Every dual-channel event uses a matching `event_id` on both client and server. Meta's Event Manager automatically deduplicates events with the same `event_id`.

| Event | Frontend eventID | Backend eventID | How they match |
|---|---|---|---|
| **Purchase** (COD) | `order_${orderId}` | `order_${order.id}` | Same DB ID from API response |
| **Purchase** (Ziina) | N/A (no pixel event) | `order_${order.id}` | Single channel |
| **Lead** | `lead_${email}_${ts}` | Uses `body.eventId` from request body | Frontend generates, passes to backend |
| **CompleteRegistration** | Uses `data.data.eventId` from API response | `register_${user.id}` | Backend generates, returns in response |

**Critical rule:** The side that generates the eventId must also share it with the other side. Never use `Date.now()` or `Math.random()` on both sides independently — they will never match.

### 2. fbp and fbc Cookies (Browser Session Matching)

The Facebook Pixel SDK sets `_fbp` and `_fbc` as first-party cookies. These are critical for CAPI event matching — they let Meta connect server-side events to browser sessions.

**How it works:**

```
Browser                          Backend                        Meta
───────                          ───────                        ────
1. Pixel SDK sets _fbp cookie
2. _fbp = "fb.1.1234567890.1234567890"
3. getFbp() reads cookie
4. Sends fbp in request body ──► 5. Receives fbp from body
                                  6. Passes to sendMetaEvent() ──► 7. Meta matches
                                      { fbp: body.fbp }            to browser session
```

**Frontend utility** (`lib/meta-cookies.ts`):
```typescript
export function getFbp(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}
```

**Every request that triggers a CAPI event passes fbp/fbc:**
- Checkout submit: `orderData.fbp = getFbp()`
- Contact form: `body: { ...formData, fbp: getFbp(), fbc: getFbc() }`
- Signup: `apiPost("/api/auth/sign-up", { ...signUpData, fbp: getFbp(), fbc: getFbc() })`

**For Ziina orders**, fbp/fbc are stored in the database (`Order.fbp`, `Order.fbc`) at checkout time, then read back when the webhook fires (user is no longer on the site).

### 3. Currency Consistency

All events use `"AED"` as the currency — both in pixel calls and CAPI events. Zero `"EGP"` references in the codebase.

### 4. Graceful Degradation

- `sendMetaEvent()` logs a warning if `META_PIXEL_ID` or `META_ACCESS_TOKEN` is not set, then returns silently
- `fbq()` wrapper checks `typeof window.fbq === "function"` before calling
- `trackSearch()` uses a `Set` ref to track already-tracked queries and avoid duplicates

### 5. Adding a New Event

To add a new tracked event:

1. **Frontend pixel**: Add a function in `lib/facebook-pixel.ts` (e.g., `fbCustomEvent`) — include `eventId` param for dedup
2. **Analytics wrapper**: Add a `trackCustomEvent()` in `lib/analytics.ts` that calls both `fbCustomEvent()` and `POST /api/analytics/track/custom-event`
3. **Call it**: Import and call `trackCustomEvent()` from the relevant component/hook
4. **Backend CAPI** (if needed): Import `sendMetaEvent` in the relevant service and call it with `eventName: "CustomEvent"`
5. **If dual-channel**: Ensure eventId is generated on one side and shared with the other (via request body or API response)
6. **Pass fbp/fbc**: Import `getFbp, getFbc` from `@/lib/meta-cookies` and include in the request body

### 6. Backend CAPI for Non-Purchase Events

For events where you want server-side tracking:

```typescript
await sendMetaEvent({
  eventName: "Lead",
  email: body.email,
  phone: body.phone,
  firstName: body.name.split(" ")[0],
  lastName: body.name.split(" ").slice(1).join(" ") || undefined,
  userAgent: request.headers.get("user-agent") || undefined,
  ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
  eventId: body.eventId,  // from frontend for dedup
  fbp: body.fbp,          // from browser cookie
  fbc: body.fbc,          // from browser cookie
});
```

---

## Testing Checklist

- [ ] View a product page → Events Manager shows `ViewContent`
- [ ] Search from header → Events Manager shows `Search`
- [ ] Search from overlay → Events Manager shows `Search`
- [ ] Add item to cart (card/product/quick-view) → Events Manager shows `AddToCart`
- [ ] Remove item from cart → Events Manager shows `RemoveFromCart`
- [ ] Add to wishlist → Events Manager shows `AddToWishlist`
- [ ] Go to checkout → Events Manager shows `InitiateCheckout`
- [ ] Select payment method → Events Manager shows `AddPaymentInfo`
- [ ] Complete COD order → Events Manager shows **one** `Purchase` (deduplicated)
- [ ] Complete Ziina order → Events Manager shows **one** `Purchase` (server-side only)
- [ ] Register new account → Events Manager shows **one** `CompleteRegistration` (deduplicated)
- [ ] Submit contact form → Events Manager shows **one** `Lead` (deduplicated) + owner receives email
- [ ] Navigate between pages → Events Manager shows `PageView` per route
- [ ] Cancel checkout → Events Manager shows custom `RemoveFromCart` or abandon event
- [ ] Events Manager → Event Match Quality score should be 6+ (fbp + hashed email = good match)
