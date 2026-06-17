# Meta Pixel + Conversions API — Code Review

> Strict review of the dual-channel Meta tracking implementation in `apps/marketing` (Next.js / Pixel) and `apps/backend` (Elysia / CAPI). Focus: **event duplication**, **wrong logic**, and alignment with **international e-commerce best practices**.
>
> Best-practice basis: Meta official docs —
> [Deduplicate Pixel and Server Events](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events),
> [Best Practices](https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices),
> [Customer Information Parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters),
> [Using the API](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api).

---

## Executive Summary

The architecture is sound in principle: a redundant Pixel + CAPI setup with `event_id`-based deduplication, hashed user data, and `_fbp`/`_fbc` browser-identifier forwarding. Three conversion-critical events (**Purchase COD**, **Lead**, **CompleteRegistration**) are deduplicated correctly.

However, there are **3 P0 issues** that cause **silent event double-counting / data corruption today**:

1. **AddToCart & InitiateCheckout are dual-channel but never deduplicated** — the pixel omits the `eventID` and the server generates an independent `Date.now()` id, so Meta counts both. This inflates your highest-intent funnel events.
2. **The Ziina webhook idempotency guard misses `CONFIRMED`** — a replayed webhook double-decrements stock, double-increments coupons, double-sends emails, and fires a duplicate server Purchase. Meta does **not** dedupe server↔server duplicates, so this is a real duplicate conversion.
3. **The `hash()` function normalizes every field the same way** — phone numbers and cities are hashed without proper normalization, destroying Event Match Quality on your richest COD signal (phone).

Beyond those, there is **no consent layer** (UAE-PDPL / GDPR exposure), **Automatic Advanced Matching is disabled**, **`country` is never sent**, and **CAPI has no retry/backoff**. None of the P0s are hard to fix.

**Finding counts:** P0 = 3 · P1 = 5 · P2 = 6

---

## Findings Summary

| ID | Sev | Title | Location |
|---|---|---|---|
| F1 | **P0** | AddToCart & InitiateCheckout dual-channel with no matching `eventID` → double-count | `apps/marketing/src/lib/facebook-pixel.ts:78,112` · `apps/backend/src/modules/analytics/index.ts:171,337` |
| F2 | **P0** | Ziina webhook idempotency guard ignores `CONFIRMED` → duplicate Purchase + double side effects | `apps/backend/src/modules/payment/service.ts:213` |
| F3 | **P0** | `hash()` uses one trim+lowercase for all fields → phone/city normalization wrong, tanks EMQ | `apps/backend/src/lib/meta-capi.ts:8-13` |
| F4 | **P1** | RemoveFromCart: client `trackCustom` vs server standard `event_name` — won't dedup; not an optimization event | `apps/marketing/src/lib/facebook-pixel.ts:101` · `apps/backend/src/modules/analytics/index.ts:208` |
| F5 | **P1** | No consent gating on pixel load or PII; no `data_processing_options` / LDU (UAE-PDPL / GDPR) | `apps/marketing/src/components/analytics/facebook-pixel.tsx:13-32` · `apps/backend/src/lib/meta-capi.ts:89-108` |
| F6 | **P1** | Automatic Advanced Matching disabled + no `external_id` in `init`; `country`/location not sent | `apps/marketing/src/components/analytics/facebook-pixel.tsx:29` · `apps/backend/src/lib/meta-capi.ts:61-70` |
| F7 | **P1** | CAPI has no retry/backoff/queue; `event_source_url` missing | `apps/backend/src/lib/meta-capi.ts:124-141` |
| F8 | **P1** | Currency is a silent `|| "AED"` default everywhere — masks multi-currency bugs | `apps/marketing/src/lib/facebook-pixel.ts` (multiple) · `apps/backend/src/lib/meta-capi.ts:44` |
| F9 | **P2** | Graph API pinned to aging `v19.0` | `apps/backend/src/lib/meta-capi.ts:6` |
| F10 | **P2** | `test_event_code` leak risk (Meta does not drop test events in prod) | `apps/backend/src/lib/meta-capi.ts:110-112` |
| F11 | **P2** | COD path reads fbp/fbc via untyped `(body as any)`; contrast clean Ziina DB path | `apps/backend/src/modules/order/service.ts:192-193,255-256` |
| F12 | **P2** | `Login` event_id embeds `Date.now()` (`login_${user.id}_${Date.now()}`) — fine server-only, breaks if a pixel is ever added | `apps/backend/src/modules/auth/index.ts:65` |
| F13 | **P2** | Pixel wrapper logs full args to console in prod; stray module-load `console.log` of pixel ID | `apps/marketing/src/lib/facebook-pixel.ts:22` · `apps/marketing/src/components/analytics/facebook-pixel.tsx:5` |
| F14 | **P2** | `Lead` event_id embeds email (`lead_${email}_${ts}`) — mildly leaky in logs/URLs | `apps/marketing/src/app/[locale]/contact/hooks/use-contact-form.ts:30` |

---

## Detailed Findings

### F1 — P0 · AddToCart & InitiateCheckout are dual-channel but never deduplicated

**Problem.** Both events are sent through the Pixel **and** CAPI, but the two channels use different (or no) event ids.

Client pixel — no 4th-arg `eventID`:
```ts
// apps/marketing/src/lib/facebook-pixel.ts:78
fbq("track", "AddToCart", { content_ids: [...], value, currency, contents });
// apps/marketing/src/lib/facebook-pixel.ts:118
fbq("track", "InitiateCheckout", { content_ids, value, currency, num_items });
```

Server CAPI — independent `Date.now()` id:
```ts
// apps/backend/src/modules/analytics/index.ts:171
eventId: `cart_${body.variantId}_${Date.now()}`,
// apps/backend/src/modules/analytics/index.ts:337
eventId: `checkout_${Date.now()}`,
```

**Impact.** Meta dedupes only when CAPI `event_id` **===** Pixel 4th-arg `eventID` **AND** `event_name` matches ([source](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)). Here the pixel sends no id and the server sends a random one → nothing matches → **both events are counted**. AddToCart and InitiateCheckout are the two highest-intent funnel events you optimize on; double-counting skews audience building and ROAS.

**Recommendation.** Pick one side to generate the id and echo it. For funnel steps without a stable entity, generate a client UUID and forward it in the track body:

```ts
// apps/marketing/src/lib/facebook-pixel.ts — accept eventId param
export function fbAddToCart(params: { ...; eventId?: string }) {
  const ev = { content_ids: [params.contentId], ... };
  if (params.eventId) fbq("track", "AddToCart", ev, { eventID: params.eventId });
  else fbq("track", "AddToCart", ev);
}

// apps/marketing/src/lib/analytics.ts
const eventId = crypto.randomUUID();
trackEvent("cart-add", { ..., eventId });   // server reuses body.eventId
fbAddToCart({ ..., eventId });

// apps/backend/src/modules/analytics/index.ts — body must include eventId, reuse verbatim
eventId: body.eventId,   // NOT Date.now()
```

Apply the same pattern to `InitiateCheckout`. **Rule of thumb:** never use `Date.now()`/`Math.random()` independently on both sides.

---

### F2 — P0 · Ziina webhook idempotency guard ignores `CONFIRMED`

**Problem.** `handlePaymentCompleted` early-returns only on terminal fulfilment statuses, not on the status it itself sets:

```ts
// apps/backend/src/modules/payment/service.ts:213
if (order.status === "DELIVERED" || order.status === "SHIPPED") {
  console.log(`Order ${order.id} already processed`);
  return;
}
// ... then later sets status: "CONFIRMED" at line 250
```

After the first successful webhook, the order is `CONFIRMED`. Ziina (like all PSPs) **retries webhooks**; a duplicate delivery passes the guard and re-runs the entire block: stock decrement, coupon increment, owner+customer emails, and a second `sendMetaEvent({ eventName: "Purchase", ... })`.

**Impact.**
- **Double stock decrement** (data integrity / oversell risk).
- **Double coupon usage** (coupons exhausted too fast).
- **Duplicate emails** to customer + owner.
- **Duplicate Purchase in Meta** — critical: **Meta does NOT dedupe server↔server duplicates** ([source](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events): *"Does not deduplicate events when only using one event source… If you send us two consecutive server events with the same information, we do not discard either"*). So even though the `event_id` is the same (`order_${order.id}`), the second server event is still counted.

**Recommendation.** Treat `CONFIRMED` as processed, and add a payment-intent idempotency check before any side effect:

```ts
const PROCESSED = new Set(["CONFIRMED", "DELIVERED", "SHIPPED", "REFUNDED", "CANCELLED"]);
if (PROCESSED.has(order.status)) {
  console.log(`Order ${order.id} already processed (${order.status})`);
  return;
}
```

Even better: persist a `webhookProcessedEventIds` set / a `processedAt` timestamp keyed on `ziinaPaymentIntentId + event.id`, and check it **before** stock/emails/CAPI.

---

### F3 — P0 · `hash()` normalizes every field identically → broken phone/city EMQ

**Problem.** One normalization for all fields:

```ts
// apps/backend/src/lib/meta-capi.ts:8
function hash(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}
```

Meta requires **field-specific normalization** before SHA-256 ([source](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)). Concrete failures for a UAE store:

| Field | Current behavior | Meta expects | Result |
|---|---|---|---|
| `ph` | `"+971 50 123 4567"` → lowercased, still has spaces/`+` | `971501234567` (digits only, country code, no leading 0) | **never matches** |
| `ph` | `"0501234567"` (local format) → `0501234567` | `971501234567` | **never matches** |
| `ct` | `"Abu Dhabi"` → `"abu dhabi"` (space kept) | `"abudhabi"` (no spaces/punctuation) | **never matches** |
| `country` | **not sent at all** | `ae` (ISO alpha-2, always include) | lost free match key |

**Impact.** Phone is your **richest** identifier for COD orders. Mismatched phone hashing means most COD Purchases match only on IP+UA → low EMQ → worse ad optimization. EMQ target for Purchase is **6+/10**; this keeps it near the floor.

**Recommendation.** Replace the single `hash()` with per-field normalizers, and add the missing location fields:

```ts
function sha256(v: string) {
  return crypto.createHash("sha256").update(v).digest("hex");
}
function normalizePhone(v: string): string {
  let d = v.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("971")) return d;            // already international
  if (d.startsWith("0")) return "971" + d.slice(1); // UAE local 0XX -> 971XX
  if (d.length === 9) return "971" + d;          // 5XXXXXXXX
  return d;
}
function normalizeCity(v: string): string { return v.toLowerCase().replace(/[\s\-.']/g, ""); }

// usage
if (email) userData.em = sha256(email.trim().toLowerCase());
if (phone) userData.ph = sha256(normalizePhone(phone));
if (city) userData.ct = sha256(normalizeCity(city));
if (country) userData.country = sha256(country.trim().toLowerCase()); // "ae"
// fbp/fbc/ip/ua: DO NOT hash
```

Also surface `city`, `state`, `zipCode`, `country` on the `CAPIEvent` interface and forward them from the order's shipping address (you already collect all of them).

---

### F4 — P1 · RemoveFromCart: custom on client, "standard" on server

**Problem.**
```ts
// Client — custom event
fbq("trackCustom", "RemoveFromCart", { ... });          // facebook-pixel.ts:101

// Server — treated as a standard event_name
await sendMetaEvent({ eventName: "RemoveFromCart", ... }); // analytics/index.ts:208
```

**Impact.** Different call types (`trackCustom` vs `track`) means the events are not comparable for dedup, and `RemoveFromCart` is **not a Meta standard event** — it cannot be used for optimization and only pollutes the dataset. Same anti-pattern applies to the custom checkout-abandon/checkout-step events (those are correctly internal-only; RemoveFromCart should be too).

**Recommendation.** **Remove the CAPI call for RemoveFromCart** in `analytics/index.ts`. Keep it as a custom pixel event + internal analytics only. Do not spend CAPI budget on non-optimization events.

---

### F5 — P1 · No consent gating; no LDU / `data_processing_options`

**Problem.**
- The Pixel script is injected and fires `PageView` **unconditionally** on every page load (`facebook-pixel.tsx:13-32`).
- `analytics.ts` always POSTs, and `meta-capi.ts` always hashes+sends PII whenever present.
- No `data_processing_options` / `data_processing_options_country` / `data_processing_options_state` anywhere → CCPA/US-state handling absent.

**Impact.** For your UAE primary market, UAE-PDPL requires a lawful basis/consent for analytics marketing cookies. If you ever serve EU traffic this becomes a hard GDPR/ePrivacy violation (loading `fbevents.js` before consent is itself a breach). International e-commerce sites (Shopify Plus, global DTC brands) gate **both** the pixel script load **and** CAPI PII behind a CMP (OneTrust, Cookiebot, Usercentrics).

**Recommendation.**
1. Add a consent gate before injecting `fbevents.js` and before each `fbq('track')`.
2. Thread a `marketingConsented` flag from client → track bodies and from order/contact/auth payloads; in `sendMetaEvent`, **omit hashed PII (em/ph/fn/ln/ge/db/ct/st/zp/country)** when not consented (optionally still send IP+UA, or skip entirely).
3. Add `data_processing_options` support to `sendMetaEvent` (parameterize `["LDU"]` + country + state) and set it for US-state users (you already have the IP).

---

### F6 — P1 · Automatic Advanced Matching disabled; identifiers under-sent

**Problem.**
```ts
// apps/marketing/src/components/analytics/facebook-pixel.tsx:28-29
fbq('init', '${FB_PIXEL_ID}');
fbq('set', 'autoConfig', 'false', '${FB_PIXEL_ID}');   // ← disables AAM
```
- `autoConfig: false` turns off **Automatic Advanced Matching** (AAM), the feature that captures `em`/`ph`/`fn`/`ln` from forms for free and lifts pixel-side EMQ.
- No advanced-matching object passed to `init` (no `external_id`).
- Server sends only `em, ph, fn, ln, ip, ua, fbp, fbc` — omits `external_id`, `ge`, `db`, `ct`, `st`, `zp`, `country`, `subscription_id` despite shipping location being collected at checkout.

**Impact.** Lost EMQ lift on both channels for free. Biggest per-parameter lift order is roughly `em > ph > fbp+fbc > external_id > name/location`.

**Recommendation.**
1. Unless you have a specific reason to disable AAM, **remove the `autoConfig: false` line**.
2. Pass `{ external_id: <userId> }` (and logged-in user fields you already hold) to `fbq('init')` for authenticated users.
3. Forward shipping `city/state/zipCode/country` to CAPI for Purchase events (normalized+hashed; see F3).

---

### F7 — P1 · CAPI has no retry/backoff/queue; `event_source_url` missing

**Problem.**
```ts
// apps/backend/src/lib/meta-capi.ts:124-141
const res = await fetch(...);
if (!res.ok) { console.error("Meta CAPI error:", await res.text()); }
```
Single fire-and-forget. A transient Graph API 5xx/429 silently loses a Purchase event. No batching, no `event_source_url`, no `action_source` parameterization (hardcoded `"website"`).

**Impact.** Purchase is the most valuable event; losing it to a transient blip silently under-attributes revenue. `event_source_url` improves attribution.

**Recommendation.**
- Retry 429/5xx with exponential backoff (e.g. 3 attempts); do not retry 4xx.
- Optionally enqueue Purchase events to a persistent table for replay within Meta's 7-day `event_time` window.
- Set `event_source_url` to the relevant page URL (store it on the order or derive from request).
- Batch up to 1000 events/request at scale (note: one invalid event rejects the whole batch).

---

### F8 — P1 · Currency is a silent `|| "AED"` default

**Problem.** Every wrapper and `sendMetaEvent` defaults `currency = "AED"` when omitted:
```ts
currency: params.currency || "AED"   // facebook-pixel.ts (every event)
currency = "AED",                     // meta-capi.ts:44
```
Some events (`fbViewCategory`, `fbSearch`) send no `value`/`currency` at all.

**Impact.** For a UAE-only store this is low risk, but the silent default **masks bugs**: a future multi-currency path that forgets to pass currency will silently report AED and corrupt value-optimization models. International e-commerce stores make currency an explicit required field per event.

**Recommendation.** Make `currency` an explicit required parameter on value-bearing events (remove the `|| "AED"` default at the wrapper boundary) and store it with each order. Decide deliberately whether valueless events (Search, ViewContent) are acceptable for your campaign setup.

---

### F9 — P2 · Graph API pinned to `v19.0`

**Problem.** `apps/backend/src/lib/meta-capi.ts:6` pins `API_VERSION = "v19.0"`. Current Graph API versions are ~`v25.0`. v19.0 is still within Meta's ~2-year support window but aging.

**Recommendation.** Plan an upgrade; test in Events Manager after switching. Keep it as an env-overridable constant.

---

### F10 — P2 · `test_event_code` leak risk

**Problem.** `meta-capi.ts:110-112` adds `test_event_code` whenever `META_TEST_EVENT_CODE` is set. Meta **does not drop** test events — they flow into Events Manager and are used for targeting/measurement ([source](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api)).

**Recommendation.** Ensure the env var is **unset in production** (CI/env policy). Consider a hard guard that refuses to start in prod if the var is set.

---

### F11 — P2 · COD path reads fbp/fbc via untyped `(body as any)`

**Problem.**
```ts
// apps/backend/src/modules/order/service.ts:192, 255-256
fbp: (body as any).fbp || null,
fbc: (body as any).fbc || null,
...
fbp: (body as any).fbp,
fbc: (body as any).fbc,
```
If the order-create route body schema (`OrderModel.createBody`) does not actually declare `fbp`/`fbc`, Elysia will strip them before the handler runs → COD Purchase silently loses fbp/fbc (EMQ + fbp-fallback loss). The Ziina path is clean because it persists to the DB (`payment/service.ts:110-111`) and reads `order.fbp` at line 316.

**Recommendation.** Add `fbp`/`fbc` to the `createBody` schema and read them as typed fields. Standardize: persist fbp/fbc on the order for **both** flows and read from the DB, matching the Ziina path.

---

### F12 — P2 · `Login` event_id embeds `Date.now()`

**Problem.** `apps/backend/src/modules/auth/index.ts:65`: `loginEventId = \`login_${user.id}_${Date.now()}\``. Harmless today because Login is server-only (no matching pixel), but it would silently break dedup the moment a client Login pixel is added.

**Recommendation.** Drop `Date.now()`: `login_${user.id}` is stable and replay-safe. (Only events that genuinely need per-occurrence uniqueness while there's no stable entity should use a UUID.)

---

### F13 — P2 · Pixel logging in production

**Problem.**
- `facebook-pixel.ts:22`: `console.log("[Pixel]", ...args)` on every `fbq` call in production.
- `facebook-pixel.tsx:5`: `console.log(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID)` at module load.

**Recommendation.** Gate logs behind `process.env.NODE_ENV !== "production"`. PII in pixel payloads is low-risk (custom data usually has no PII), but event_id args do get logged — keep it clean.

---

### F14 — P2 · `Lead` event_id embeds email

**Problem.** `use-contact-form.ts:30`: `leadEventId = \`lead_${formData.email}_${Date.now()}\``. The id (which appears in logs and Meta's UI) contains the raw email.

**Recommendation.** Use a UUID or a hash of the email. Functionally correct for dedup (both sides share it), just mildly leaky.

---

## What's Done Well (do not break these)

- **COD Purchase deduplication** — `fbPurchase({ orderId })` sends `eventID: order_${orderId}` (`facebook-pixel.ts:162-165`) and `order/service.ts:254` reuses `eventId: order_${order.id}`. Textbook correct dual-channel.
- **Ziina fbp/fbc persistence** — stored on the order at checkout (`payment/service.ts:110-111`) and replayed from the DB on the webhook (`payment/service.ts:316-317`), since the user is off-site. This is the right pattern for deferred/server-only events.
- **Lead shared eventId** — frontend generates `leadEventId`, passes it in the contact body (`use-contact-form.ts:30,34`), backend reuses `body.eventId` (`contact/index.ts:31`), pixel fires the same id (`use-contact-form.ts:39`). Correct.
- **CompleteRegistration shared eventId** — backend generates `register_${user.id}`, returns it in the response (`auth/index.ts:25,42`); client fires the pixel with the same id. Entity-anchored → stable across replays. Correct.
- **SHA-256 hashing** is applied to all PII fields (just needs per-field normalization — see F3).
- **Graceful degradation** — `sendMetaEvent` warns and skips when `META_PIXEL_ID`/`META_ACCESS_TOKEN` missing (`meta-capi.ts:56-59`); `fbq` wrapper checks `typeof window.fbq` (`facebook-pixel.ts:14-16`); `hasMatchableKey` guard rejects un-matchable events (`meta-capi.ts:77-87`).

---

## International E-Commerce Best-Practices Checklist

| # | Best practice | Status | Where |
|---|---|---|---|
| 1 | Conversion events (Purchase) dual-channel with matching `event_id` | ✅ done (COD), ⚠️ Ziina (F2 idempotency) | order/payment service |
| 2 | All dual-channel events share `event_id` (no independent `Date.now()`) | ❌ missing (F1, F12) | facebook-pixel.ts, analytics/index.ts |
| 3 | Webhook events idempotent (no server↔server dupes) | ❌ missing (F2) | payment/service.ts |
| 4 | Per-field normalization before hashing (phone/city/zip/country) | ❌ missing (F3) | meta-capi.ts |
| 5 | `country` always sent (ISO alpha-2) | ❌ missing (F3) | meta-capi.ts |
| 6 | Automatic Advanced Matching enabled; `external_id` in `init` | ❌ disabled (F6) | facebook-pixel.tsx |
| 7 | All available advanced-matching params sent (ct/st/zp/external_id) | ⚠️ partial (F6) | meta-capi.ts |
| 8 | `_fbp`/`_fbc` forwarded on all CAPI events | ✅ done | meta-cookies + services |
| 9 | Deferred events (webhook) persist fbp/fbc in DB | ✅ done (Ziina) | payment/service.ts |
| 10 | Pixel gated behind marketing consent (CMP) | ❌ missing (F5) | facebook-pixel.tsx |
| 11 | CAPI PII gated behind consent; `data_processing_options`/LDU supported | ❌ missing (F5) | meta-capi.ts |
| 12 | CAPI retry/backoff on 429/5xx | ❌ missing (F7) | meta-capi.ts |
| 13 | `event_source_url` set on server events | ❌ missing (F7) | meta-capi.ts |
| 14 | Currency explicit per event (no silent default) | ⚠️ partial (F8) | facebook-pixel.ts, meta-capi.ts |
| 15 | Custom/non-optimization events kept out of CAPI | ❌ missing (F4) | analytics/index.ts |
| 16 | `test_event_code` cannot leak to prod | ⚠️ partial (F10) | meta-capi.ts |
| 17 | No prod console logging of tracking args | ❌ missing (F13) | facebook-pixel.ts |

---

## Prioritized Action Plan

**P0 — fix now (silent double-counting / data corruption):**
1. **F1** — Add `eventId` param to `fbAddToCart` / `fbInitiateCheckout`; generate `crypto.randomUUID()` client-side; forward in track body; server reuses `body.eventId`. Remove `Date.now()` in `analytics/index.ts:171,337`.
2. **F2** — Add `CONFIRMED` (+ other terminal statuses) to the idempotency guard in `payment/service.ts:213` **before** any side effect; add a payment-intent idempotency check.
3. **F3** — Replace single `hash()` with per-field normalizers; add `country` + location fields to `CAPIEvent` and forward from order shipping address.

**P1 — fix soon (match quality, privacy, reliability):**
4. **F4** — Remove the RemoveFromCart CAPI call.
5. **F5** — Add a consent gate around pixel load + CAPI PII; add `data_processing_options` support.
6. **F6** — Remove `autoConfig:false`; pass `external_id` to `fbq('init')`; forward ct/st/zp/country.
7. **F7** — Add retry/backoff; set `event_source_url`; queue Purchase for replay.
8. **F8** — Make `currency` an explicit required field on value-bearing events.

**P2 — cleanup / hardening:**
9. **F9** — Upgrade Graph API version (env-overridable).
10. **F10** — Guard `test_event_code` against prod.
11. **F11** — Type `fbp`/`fbc` on the COD order body; persist + read from DB like Ziina.
12. **F12** — Drop `Date.now()` from Login event_id.
13. **F13** — Gate pixel console logs behind non-prod.
14. **F14** — Use UUID/hash instead of raw email in Lead event_id.

---

## Verification (post-fix)

- In **Events Manager → Test Events**, fire each fixed event and confirm **one** processed event per `event_id` with the expected Connection Method.
- For AddToCart/InitiateCheckout: expect to see a single deduplicated event (was two before the fix).
- For Ziina: send a duplicate webhook manually and confirm stock/coupon/email/CAPI are **not** re-run.
- Check **Event Match Quality** for Purchase rises toward 6+/10 after F3/F6 (phone + country + location).
- Confirm `data_processing_options` appears in payloads when set.

---

## Login Event — Deep Dive

Scoped review of the Meta **Login** event, verifying whether F12's P2 rating still holds and whether the Login CAPI call is correctly wired, valuable, and privacy-safe.

### Current implementation

Login is **server-side only (CAPI)**. There is no client-side Login pixel anywhere in `apps/marketing`.

Server handler — fires exactly once per successful credential check:
```ts
// apps/backend/src/modules/auth/index.ts:49-88
.post("/sign-in", async ({ body, jwt, jwtRefresh, request }) => {
    const result = await AuthService.signIn(body);
    if (!result.ok) return status(result.status, { success: false, error: result.error });

    const user = result.data;
    const accessToken = await jwt.sign({ sub: user.id, role: user.role });
    const refreshToken = await jwtRefresh.sign({ sub: user.id });

    const userAgent = request.headers.get("user-agent") || undefined;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || undefined;

    const loginEventId = `login_${user.id}_${Date.now()}`;          // ← F12

    await sendMetaEvent({
      eventName: "Login",
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || undefined,
      userAgent, ip,
      eventId: loginEventId,
      fbp: body.fbp,
      fbc: body.fbc,
    });

    return { success: true, data: { user, accessToken, refreshToken } };
  },
  { body: AuthModel.signInBody }
)
```

Frontend call — **does** forward `fbp`/`fbc` (unlike the COD path in F11):
```ts
// apps/marketing/src/contexts/auth-context.tsx:123-128
const signIn = useCallback(async (email, password) => {
  const data = await apiPost("/api/auth/sign-in",
    { email, password, fbp: getFbp(), fbc: getFbc() });   // ← fbp/fbc forwarded
  ...
}, []);
```

Body schema — `fbp`/`fbc` are typed, so Elysia will **not** strip them:
```ts
// apps/backend/src/modules/auth/model.ts:13-18
signInBody: t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
  fbp: t.Optional(t.String()),
  fbc: t.Optional(t.String()),
}),
```

Verified negative results (no duplicate fire-paths):
- `sendMetaEvent` with `eventName: "Login"` appears at exactly **one** site in the backend (`auth/index.ts:67`). The `/refresh` handler (`auth/index.ts:89-111`) issues new tokens but does **not** fire any Meta event → token refresh cannot double-count Login.
- No `fbLogin` / `fbq('track', 'Login', …)` exists in `apps/marketing` (grep across `*.{ts,tsx}` → 0 matches). The pixel lib (`apps/marketing/src/lib/facebook-pixel.ts`) exposes 12 wrappers (`fbPageView`, `fbViewContent`, `fbAddToCart`, `fbPurchase`, `fbLead`, `fbCompleteRegistration`, …) — **none for Login**. The sign-in response also returns no `eventId` to the client (contrast sign-up at `auth/index.ts:42`, which does), confirming server-only is the deliberate design.

### Findings

#### F12 — P2 (unchanged) · `Login` event_id embeds `Date.now()`
- **File**: `apps/backend/src/modules/auth/index.ts:65`
- **Problem**: `loginEventId = \`login_${user.id}_${Date.now()}\``. Today this is harmless because Login is server-only — there is no pixel `eventID` to match, so no dedup contract exists to break. It becomes a **real double-count bug** the moment a client Login pixel is added: the pixel would have to be passed this server-generated id (impossible — the id is created *after* the request) or generate its own, and the two ids would never match → both events counted (same class of bug as F1).
- **Secondary problem**: `Date.now()` makes the id non-deterministic, so every retry/replay produces a *different* id. Combined with the lack of an idempotency guard (see F12.4), duplicates are not even candidates for Meta's rolling-window dedup.
- **Recommendation**: Use the entity-anchored, stable form already established for sign-up (`register_${user.id}` at `auth/index.ts:25`):
  ```ts
  const loginEventId = `login_${user.id}`;
  ```
  If a pixel is ever added, do **not** try to reuse a server id — switch to a **client-generated UUID forwarded both ways** (the same pattern prescribed for AddToCart in F1), e.g. the sign-in form generates `crypto.randomUUID()`, posts it as `body.eventId`, fires `fbq('track','Login', …, { eventID })`, and the server reuses `body.eventId`. Never use `Date.now()`/`Math.random()` as an id on either side.
- **Why F12 stays P2**: verified server-only → no active double-count in production today. No severity change.

#### F12.1 — P2 (new) · "Login" is not a Meta standard event — the CAPI call has ~zero optimization value
- **File**: `apps/backend/src/modules/auth/index.ts:68` (`eventName: "Login"`)
- **Problem**: Meta's standard events are a fixed list — `PageView, ViewContent, Search, AddToCart, AddToWishlist, InitiateCheckout, AddPaymentInfo, Purchase, Lead, CompleteRegistration, Contact, CustomizeProduct, FindLocation, Schedule, StartTrial, SubmitApplication, Subscribe` ([Pixel reference](https://www.facebook.com/business/help/402791146561655), the same reference cited in the header of `apps/marketing/src/lib/facebook-pixel.ts:3`). **"Login" is not on it.** Sending `event_name: "Login"` registers a **custom event** in Events Manager. Custom events can populate custom audiences and can be referenced in reports, but they **cannot be selected as conversion events for campaign optimization** and do not drive delivery/attribution the way `Purchase` or `Lead` do.
- **Impact**: You are spending CAPI budget and — more importantly — transmitting authenticated-user PII (email, phone, fn, ln) to Meta for an event that cannot optimize any campaign. The cost (privacy exposure, API calls, PII egress of identifiable users) is real; the ad-value is essentially nil. This is the same anti-pattern flagged for `RemoveFromCart` in F4.
- **Recommendation (pick one)**:
  1. **Preferred — drop the CAPI Login call entirely.** Track logins in your own analytics DB (you already have `trackAuthLogin` at `apps/backend/src/modules/analytics/service.ts:438` and `logAuthLogin` at `apps/backend/src/lib/logger.ts:252` — use those). If you want a "logged-in users" Meta audience, build it from a server-side audience upload of-hashed emails, not from per-login CAPI events.
  2. **If you must keep it** — keep it server-only, fix the id (F12), gate it behind consent (F12.2), and treat it strictly as an audience/analytics signal, never as an optimization event.

#### F12.2 — P2 (new) · Login PII sent to CAPI unconditionally — no consent gate
- **File**: `apps/backend/src/modules/auth/index.ts:67-78` (and the unconditional hasher at `apps/backend/src/lib/meta-capi.ts:63-70`)
- **Problem**: Every successful sign-in hashes and ships `em`, `ph`, `fn`, `ln` of an **authenticated, identified user** to Meta, with no marketing-consent check. This is the F5 gap instantiated on the highest-sensitivity event type: the user is performing a functional action (authentication) that has nothing to do with marketing, yet their identity is exfiltrated to an ad platform. For UAE traffic this is a UAE-PDPL lawful-basis risk; for any EU traffic it is a hard GDPR/ePrivacy violation (transmission of hashed PII to a third party for ad attribution is "processing" and needs a basis).
- **Impact**: Login PII of *every registered user who ever signs in* is being sent to Meta regardless of consent status. This is worse than the anonymous PageView case because the data is fully identifiable.
- **Recommendation**: Same fix as F5 — thread a `marketingConsented` flag to the sign-in payload and, in `sendMetaEvent`, **omit `em/ph/fn/ln` (and ideally skip the call entirely) when not consented**. Better still, combined with F12.1: if you drop the Login CAPI call, this issue evaporates for free.

#### F12.3 — P3 (new) · Login inherits the F3 phone-hash normalization bug
- **File**: `apps/backend/src/lib/meta-capi.ts:8-13` (applied to Login's `phone` via `meta-capi.ts:64`)
- **Problem**: `phone: user.phone || undefined` is hashed with the one-size-fits-all `hash()` (`value.trim().toLowerCase()`). For a UAE store, `user.phone` typically looks like `"+971 50 123 4567"` or `"0501234567"` — neither matches Meta's required `971501234567` form (digits-only, country code, no leading zero). The hashed value therefore never matches anything Meta holds → `ph` is dead weight on every Login event. Same applies to `fn`/`ln` for names containing punctuation (`O'Brien`, `Abdul-Rahman`) — lowercased+trimmed keeps the hyphen/apostrophe, which Meta strips.
- **Impact**: Low for Login specifically (Login isn't optimizing anything per F12.1, and `em` alone carries match quality), but it compounds with F3 across the dataset and silently caps EMQ.
- **Recommendation**: Fixed centrally by the F3 remediation (per-field normalizers). No Login-specific work needed beyond consuming the fixed `hash` helpers.

#### F12.4 — P3 (new) · No idempotency guard on sign-in retry → duplicate, non-dedupable Login events
- **File**: `apps/backend/src/modules/auth/index.ts:52-78`
- **Problem**: The handler fires `sendMetaEvent` on every successful `AuthService.signIn`. If the client's POST times out after the server has already processed (the token response is lost in transit) and the user/form retries, the server runs the handler a second time → a **second** Login event with a **new** `login_${user.id}_${new Date.now()}` id. Per F2, Meta does **not** dedupe server↔server duplicates, and the differing ids make it impossible even in principle. (`/refresh` is safe — it doesn't fire Login — but `/sign-in` itself is not idempotent from a tracking standpoint.)
- **Impact**: Edge-case duplicate Login events on flaky networks or double-clicks on the submit button. Low volume, but unbounded (no dedupe, no guard).
- **Recommendation**: Two layers, in order of value:
  1. **Disable the submit button while in-flight** in `apps/marketing/src/app/[locale]/auth/hooks/use-signin-form.ts` (the hook already tracks `state.isLoading` at line 25 — verify the button is `disabled={state.isLoading}` to prevent double-submit).
  2. If Login CAPI is kept (contra F12.1), add a short-TTL idempotency record keyed on `userId + email` (e.g. 10 seconds in Redis) before firing, so a literal retry within the window is a no-op. The stable `login_${user.id}` id from F12 also helps here as the idempotency key.

#### Positive observations (do not break these)
- **`fbp`/`fbc` are correctly typed and forwarded** — `AuthModel.signInBody` declares them (`model.ts:16-17`) and the client sends `getFbp()/getFbc()` (`auth-context.tsx:127`). This is the *clean* pattern; contrast F11's `(body as any)` on the COD path. Browser-identifier matching on Login is preserved whenever the `_fbp`/`_fbc` cookies are present (i.e. for any visitor who has seen the pixel). No new finding here — this is a confirmation, not a regression.
- **Login CAPI failure does not block authentication** — `sendMetaEvent` swallows errors internally (`meta-capi.ts:124-141`, try/catch + `console.error`). Tracking outages cannot break login. Correct.
- **`/refresh` is tracking-clean** — token rotation does not re-fire Login. Correct separation of auth-lifecycle events from marketing events.
- **No client pixel exists** — so F12's `Date.now()` is genuinely latent, not active. This is why F12 remains P2 rather than escalating to P0/P1.

### Channel strategy recommendation

**Recommendation: drop the Login CAPI call (server-only removal).** Rationale:

1. **"Login" is not optimizable.** Meta's standard-event list does not include Login, so the event cannot be chosen as a conversion objective for any campaign. Whatever signal you think Login is giving Meta for ad delivery, it isn't — Meta optimizes on standard events only. The CAPI call is therefore pure cost (PII egress + API budget) for zero delivery benefit.
2. **Server-only is the *only* channel that makes sense for Login** *if* you keep it: Login is an authenticated, backend-confirmed action (you cannot trust a client `fbq('track','Login')` — it would be trivially spamable by a logged-in user or a malicious script, and it would fire for failed logins unless gated). So pixel-only and dual-channel are both wrong for Login. Server-only is correct *mechanically*; it's the *value* of the event that is the problem.
3. **Better alternatives exist for the legitimate use cases:**
   - "Logged-in users" audience → periodic server-side **Custom Audience upload** of hashed emails (`/{audience_id}/users`), not per-login CAPI.
   - Login analytics/retention → your own DB via `trackAuthLogin` (`analytics/service.ts:438`) / `logAuthLogin` (`logger.ts:252`), which already exist.
   - Reducing anonymous→known attribution gap → solved by **Automatic Advanced Matching** (F6) on the pixel, which captures `em`/`ph` from form fields for *all* events, not just Login.

If you keep it: keep it **server-only**, fix the id to `login_${user.id}` (F12), gate behind consent (F12.2), and document explicitly that it exists only for audience/analytics purposes.

### Recommended fix

**Minimal fix (F12 only — if you insist on keeping the call):**
```ts
// apps/backend/src/modules/auth/index.ts:65
- const loginEventId = `login_${user.id}_${Date.now()}`;
+ const loginEventId = `login_${user.id}`;
```

**Recommended fix (drop the call entirely — addresses F12, F12.1, F12.2 simultaneously):**
```ts
// apps/backend/src/modules/auth/index.ts:49-88
.post("/sign-in", async ({ body, jwt, jwtRefresh, request }) => {
    const result = await AuthService.signIn(body);
    if (!result.ok) return status(result.status, { success: false, error: result.error });

    const user = result.data;
    const accessToken = await jwt.sign({ sub: user.id, role: user.role });
    const refreshToken = await jwtRefresh.sign({ sub: user.id });

-   const userAgent = request.headers.get("user-agent") || undefined;
-   const ip =
-     request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
-     request.headers.get("x-real-ip") || undefined;
-   const loginEventId = `login_${user.id}_${Date.now()}`;
-   await sendMetaEvent({
-     eventName: "Login",
-     email: user.email,
-     firstName: user.firstName,
-     lastName: user.lastName,
-     phone: user.phone || undefined,
-     userAgent, ip,
-     eventId: loginEventId,
-     fbp: body.fbp,
-     fbc: body.fbc,
-   });

+   // Login is not a Meta standard event and cannot drive optimization.
+   // Authenticated-user identity is recorded in our own analytics instead:
+   await trackAuthLogin(user.id, "password");   // analytics/service.ts:438

    return { success: true, data: { user, accessToken, refreshToken } };
  },
  { body: AuthModel.signInBody }
)
```

If a pixel is ever added in the future, use a **client-generated UUID forwarded both ways** (never a server `Date.now()`), mirroring the F1 AddToCart fix:
```ts
// apps/marketing/src/app/[locale]/auth/hooks/use-signin-form.ts (hypothetical future pixel)
const eventId = crypto.randomUUID();
await signIn(email, password, eventId);           // posts eventId in body
fbq("track", "Login", { ... }, { eventID: eventId });

// apps/backend/src/modules/auth/index.ts
eventId: body.eventId,   // reuse verbatim — NOT Date.now()
```

