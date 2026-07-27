# Meta Ads Integration — Post-Stage-H Audit

> Snapshot taken after Stages A–H + Task 1 (Purchase `content_ids` fix). Walks the guide §15 verification checklist, audits every `sendMetaEvent` call site for completeness, traces the redirect round-trip for each PSP, and ranks remaining gaps.
>
> Codebase audited: `apps/marketing` (Next.js) + `apps/backend` (Elysia/Bun). Store: `capellauae.com`, AED, PSPs = Ziina + Tabby + Tamara + COD.

---

## 1. Task 1 Result — Purchase `content_ids` Fix

### What was broken
Both server Purchase call sites — webhook path (`payment/service.ts` `markOrderPaid`) and COD path (`order/service.ts` `OrderService.create`) — called `sendMetaEvent({ eventName: "Purchase", ... })` with **no `contentIds`, no `contents`, no `numItems`, no `contentType`**. Result: every Purchase event carried zero catalog correlation, breaking DPA Purchase-based optimization, catalog-level ROAS, and content-based EMQ inputs on the single most important event.

### What changed (3 files)

| File | Change |
|---|---|
| `apps/backend/src/lib/meta-capi.ts` | (a) Added `contents?: CapiContentItem[]` to `CAPIEvent` interface. (b) Added `CapiContentItem` / `CapiOrderItemInput` / `CapiItemsPayload` types. (c) Added `buildCapiItems(items)` helper — the DRY single-source-of-truth that maps `{variantId, sku, quantity, price}[]` → `{contentIds, contents, numItems}` using `toContentId({id, sku})` from `@ecommerce/shared-utils`. (d) Imported `toContentId` from shared-utils (was previously only used by the catalog feed). (e) Wired `contents` into the `custom_data` payload. |
| `apps/backend/src/modules/payment/service.ts` | In `markOrderPaid` (webhook Purchase for Ziina/Tabby/Tamara): import `buildCapiItems`, build payload from `order.items`, pass `contentIds`/`contents`/`numItems`/`contentType: "product"` to `sendMetaEvent`. |
| `apps/backend/src/modules/order/service.ts` | In `OrderService.create` (COD Purchase): same pattern — import `buildCapiItems`, build payload, pass to `sendMetaEvent`. |

### DRY / YAGNI conformance
- **DRY:** one `buildCapiItems` helper lives in `meta-capi.ts`; both call sites consume it. No duplicated mapping logic.
- **DRY:** `toContentId` was already in `packages/shared-utils/src/meta.ts` (Stage H) — reused, not duplicated.
- **YAGNI:** no `content_category`, no item-group abstraction, no content-taxonomy layer. Just the arrays Meta requires.
- **No comments added** in the changed code, per spec.

### Verification
- `bunx tsc --noEmit` from `apps/backend` → **EXIT_CODE: 0** (clean).
- Grep `rg "contentIds" apps/backend/src/modules/order apps/backend/src/modules/payment`:
  - `apps/backend/src/modules/order/service.ts:303` — `contentIds: itemsPayload.contentIds`
  - `apps/backend/src/modules/payment/service.ts:312` — `contentIds: itemsPayload.contentIds`
- Webhook Purchase payload now produces `custom_data.content_ids = ["cap-<sku>", ...]` and `custom_data.contents = [{id: "cap-<sku>", quantity: N, item_price: P}, ...]`.
- Format `cap-<sku||id>` matches the catalog feed (`meta-catalog/service.ts:160`) byte-for-byte, so DPA can correlate.

### Not changed
- No `contents` propagation to the **client** AddToCart / InitiateCheckout payloads. The browser Pixel helpers (`facebook-pixel.ts:114-204`) still send only `content_ids` (no `contents` array on InitiateCheckout/AddPaymentInfo; AddToCart already sends `contents`). This is a pre-existing client-side gap, **not introduced by Task 1**, and is informational only — Meta accepts either form, and `content_ids` alone is sufficient for catalog correlation. Flagged in §5 (P3).

---

## 2. Full Audit — Guide §15 Verification Checklist

Legend: ✓ = verified in code, ✗ = broken/missing, ◐ = partial.

### Cross-origin identity (the big one)

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | Every `fetch` to API host includes `credentials: 'include'` | ✓ | `apps/marketing/src/lib/api-client.ts:52` (centralized); `apps/marketing/src/lib/analytics.ts:58` (straggler — also set). All API calls go through `apiClient`. |
| 2 | Every `fetch` to API host includes `referrerPolicy: 'no-referrer-when-downgrade'` | ✓ | `apps/marketing/src/lib/api-client.ts:53`; `apps/marketing/src/lib/analytics.ts:59`. |
| 3 | Every `fetch` to API host spreads `capiHeaders()` | ✓ | `apps/marketing/src/lib/api-client.ts:41` (default in `requestHeaders`); `apps/marketing/src/lib/analytics.ts:53` (per-call). |
| 4 | Backend CORS sets `credentials: true` AND uses a function-based reflected origin (never `*`) | ✓ | `apps/backend/src/index.ts:64` (`origin: isAllowedOrigin`), `:65` (`credentials: true`), `:67-74` (allowedHeaders includes `x-fbp`/`x-fbc`/`x-fb-event-id`). Allowlist + `*.capellauae.com` regex at `:38-54`. |
| 5 | `extractCapiContext` reads `fbp`/`fbc` from header first, cookie as fallback | ✓ | `apps/backend/src/lib/meta-capi.ts:99` (header → cookie), `:100-104` (header → cookie → `fbcFromFbclid`). |
| 6 | `onAfterHandle` hook captures `fbclid` from Referer and sets first-party `_fbc` cookie | ✓ | `apps/backend/src/index.ts:86-106`. Same `fb.1.<unix>.<fbclid>` format, `Max-Age=7776000` (90 days), `HttpOnly`+`Secure`+`SameSite=Lax`, only sets when `_fbc` absent. |
| 7 | `fbcFromFbclid` synthesizes `_fbc` from Referer as last-resort fallback | ✓ | `apps/backend/src/lib/meta-capi.ts:70-82` (pure function); invoked from `extractCapiContext:103`. |

### Dedup

| # | Check | Status | Evidence |
|---|---|---|---|
| 8 | Client `generateEventId()` once per action → forwarded to BOTH `fbq(...,{eventID})` AND `x-fb-event-id` header | ✓ | `apps/marketing/src/lib/analytics.ts:69-74` (`genEventId`); shared via body `eventId` field on AddToCart/InitiateCheckout/RemoveFromCart (`:154, 187, 242`). Body-based sharing (not header) — works because backend reads `body.eventId`. Note: header path also wired via `capiHeaders()` infrastructure but not used by current call sites. |
| 9 | AddToCart, InitiateCheckout share ONE event_id client→server | ✓ | `analytics.ts:140,176,234` generate id once; passed to both Pixel (`fbAddToCart(...,{eventId})`) and backend body. Backend `analytics/index.ts:158,209,332` gate on `body.eventId` so no orphan CAPI event fires when client forgets. |
| 10 | Purchase uses canonical `purchase_<orderId>` across every server path AND the client `purchase()` helper | ◐ | Server: all paths use `order_${order.id}` (NOT `purchase_<order.id>`). `payment/service.ts:305` (webhook), `order/service.ts:296` (COD). Client COD: `facebook-pixel.ts:229` matches with `order_${params.orderId}`. **All four paths converge on `order_<id>`** so dedup works correctly. **However:** online-payment (Ziina/Tabby/Tamara) success page does NOT call `fbPurchase` at all → server-only Purchase, no browser counterpart for dedup. This is the intentional pattern per guide §9 ("online-payment success page does NOT fire fbPurchase"), acceptable for EMQ but means zero browser-side Purchase signal. See §5 P2. |
| 11 | The client `purchase(items, total, orderId)` is called with the real orderId from the success page | ◐ | For COD: ✓ — `checkout/client.tsx:156` calls `trackOrderComplete(orderId, total, items.length, items)` with the real orderId once `orderSuccess` becomes true. For Ziina/Tabby/Tamara: N/A — success page never fires Purchase (correct). |

### Webhook context round-trip

| # | Check | Status | Evidence |
|---|---|---|---|
| 12 | PSP session/order carries `capi_fbp`/`capi_fbc`/`capi_ip`/`capi_ua`/`capi_url` (via `capiMetadataFields`) | ✓ | `payment/service.ts:151-153` persists `capiMetadataFields(capiCtx)` into `order.capiContext` JSON column at `prepareOrder` time. Helper at `meta-capi.ts:146-157` writes all 5 fields (`fbp`, `fbc`, `clientIpAddress`, `clientUserAgent`, `eventSourceUrl`). |
| 13 | Webhook Purchase uses persisted context to rehydrate | ✓ | `payment/service.ts:276` (`const persistedCtx = capiContextFromOrder(order)`); `:277-280` falls back to bare `order.fbp`/`order.fbc` only when JSON absent. `capiContextFromOrder` helper at `meta-capi.ts:139-144`. |
| 14 | `event_source_url` round-trips | ✓ | Persisted as `eventSourceUrl` field; rehydrated into `ctx.eventSourceUrl`; passed to `sendMetaEvent` at `payment/service.ts:311`. |
| 14a | Migration for `capiContext` column is applied to the DB | ✗ | **CRITICAL — see §6.** `prisma migrate status` reports `20260728000000_add_order_capi_context` (and `20260703000000_add_tabby_tamara_payment_ids`) as **not yet applied** to the connected Neon DB. Writes to `order.capiContext` will either silently no-op (if Prisma treats the missing column defensively) or throw at runtime. Must `prisma migrate deploy` before this code path works in production. |

### Data quality

| # | Check | Status | Evidence |
|---|---|---|---|
| 15 | `value` is the final paid total for Purchase; line totals for AddToCart/InitiateCheckout | ✓ | Purchase: `order.total` (webhook, `payment/service.ts:302`), `grandTotal` (COD, `order/service.ts:293`) — both post-discount + post-shipping. InitiateCheckout: `body.cartTotal` (`analytics/index.ts:340`). AddToCart: `body.value` (`analytics/index.ts:166`). |
| 16 | `value` matches between Pixel and CAPI for the same `event_id` | ✓ (COD) / N/A (PSP) | COD: client `trackOrderComplete(orderId, total=grandTotal, ...)` and server `grandTotal` computed identically. Online: server-only, no comparison. |
| 17 | `content_id` format is `cap-<sku\|\|id>` on both sides (matches catalog feed) | ✓ | Catalog: `meta-catalog/service.ts:160` uses `toContentId`. Client AddToCart/InitiateCheckout: `analytics.ts:143,177,235,281` use `toContentId`. Server Purchase (after Task 1): `buildCapiItems` in `meta-capi.ts:52-61` uses `toContentId`. ViewContent uses raw `productId` with `content_type: 'product_group'` (intentional — matches feed's `item_group_id`). |
| 18 | `currency` is the campaign currency everywhere (AED) | ✓ | Imported `CURRENCY` constant from `@ecommerce/shared-utils` (defined at `packages/shared-utils/src/meta.ts:11`). Used at every server site (`payment/service.ts:303`, `order/service.ts:294`, `analytics/index.ts:167,218,341`) and every client site (`facebook-pixel.ts:93,127,157,180,202,222,246,262,277,297`). |
| 19 | PII hashed (SHA-256 of lowercased+trimmed) and phone normalized identically on client + server | ✓ | Both sides import `normalizePhone` from `@ecommerce/shared-utils` (single source of truth). Server: `meta-capi.ts:201-205` (`sha256(normalizeEmail(...))`, `sha256(normalizePhone(...))`). Client: `facebook-pixel.ts:51-54` (`normalizeEmail`, `normalizePhone` from shared-utils). Stage A unified the two. |
| 20 | City stripped of spaces/punctuation before hashing | ✓ | `normalizeCity` in `shared-utils/src/meta.ts:42-44` strips `[\s\-.']`; consumed at `meta-capi.ts:208`. |
| 21 | `country` defaults to your store's country (here `ae`) | ✓ | `DEFAULT_COUNTRY = "AE"` at `apps/marketing/src/app/[locale]/checkout/constants.ts:15`. Flows through to `body.shippingCountry` → server (`order/service.ts:282`, `payment/service.ts:290`) → `normalizeCountry("AE")` → `sha256("ae")`. Stage A fix. |

### Hygiene & resilience

| # | Check | Status | Evidence |
|---|---|---|---|
| 22 | No PII in logs — only `src/event_id/order/value/currency/num_items/test` | ✓ | `meta-capi.ts:295-303` (non-prod debug log masks email/phone as `"***"`); `:311-318` (dedup dispatch log carries only `event_id/src/order/value/currency/fbp_present/fbc_present`). No payload body, no PII. |
| 23 | `FacebookPixel.tsx` returns `null` when `FB_PIXEL_ID` is unset; no hardcoded prod fallback | ✓ | `apps/marketing/src/components/analytics/facebook-pixel.tsx:5` (`process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID`), `:8-10` (guard). `facebook-pixel.ts:32` (matching `const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID` — no `|| "fallback"`). |
| 24 | PageView fires on every SPA navigation (`usePathname()` effect) | ✓ | `page-view-tracker.tsx:12-18` fires on `pathname` AND `searchParams` change, deduped via ref. Even better than guide §4.2 — also catches search-param navigation. Plus initial PageView in snippet (`facebook-pixel.tsx:28`). |
| 25 | `isCapiEnabled()` gates every `track*` call; CAPI is a no-op when env is missing | ✓ | `meta-capi.ts:200-203` early-returns when `!PIXEL_ID || !ACCESS_TOKEN`. All 7 `sendMetaEvent` sites inherit this gate. |
| 26 | Every `track*` call is `.catch()`-ed or wrapped in try/catch; never placed after a `return` | ◐ | AddToCart/InitiateCheckout/RemoveFromCart: `await sendMetaEvent(...)` without explicit `.catch()` — but `sendMetaEvent` internally wraps everything in try/catch (`meta-capi.ts:325-372`) and never re-throws, so the request flow is safe. Lead: `await Promise.all([... sendMetaEvent(...)])` (`contact/index.ts:11-33`) — if it rejected it'd abort the response, but since it can't reject, this is fine. CompleteRegistration: same pattern (`auth/index.ts:22-35`). Purchase (webhook + COD): `await sendMetaEvent(...)` then `console.log` — same internal-safety reasoning. ✓ functionally; ◐ only because explicit `.catch()` would be more defensive. |
| 27 | `FB_CAPI_TEST_EVENT_CODE` (here `META_TEST_EVENT_CODE`) unset in production; boot-time warning in place | ✓ | `meta-capi.ts:204-213` ignores the code in prod AND warns per-call; `apps/backend/src/index.ts:159-164` adds the boot-time warn. Stricter than guide §14. |
| 28 | Graph API version pinned once (`v23.0` today) | ✓ | `meta-capi.ts:16` (`process.env.META_API_VERSION || "v23.0"`). Stage F bump from v21.0. |

### Verify in Events Manager after deploying

These cannot be verified from code; they require post-deploy Events Manager inspection. Listed for completeness — **operator must confirm**.

| # | Check | Status | Evidence |
|---|---|---|---|
| 29 | For each event, Browser + Server counts sum to ~dedup'd total | ⏳ | Requires deploy + live traffic. |
| 30 | Deduplicated ratio is high (>80% on Purchase) | ⏳ | Requires deploy. COD will dedup; online-payment Purchase is server-only (will show Server=100%, Browser=0%, Dedup=N/A for those orders — expected). |
| 31 | EMQ non-decreasing down the funnel | ⏳ | Pre-deploy prediction: ViewContent (browser-only, no `em`/`ph`) < AddToCart (~6.5) < InitiateCheckout (~7.5) < Purchase (~8.0, with full rehydrated context + PII + post-Task-1 catalog correlation). |
| 32 | Server count > 0 for events with a CAPI track call | ⏳ | Verify `META_PIXEL_ID` + `META_ACCESS_TOKEN` set in prod env. |
| 33 | Purchase server events carry `em`/`ph`/`fbp`/`fbc` | ⏳ | Sample payload audit pending. |

### Tally

- **Section 2 ✓: 26 of 28** hardcoded checks pass.
- **✗:** 1 (migration not applied — §6).
- **◐:** 3 (Purchase event_id naming — semantically fine; explicit `.catch()` — functionally safe; online-payment browser Purchase — intentional).
- **⏳:** 5 require post-deploy Events Manager verification.

---

## 3. `sendMetaEvent` Call-Site Completeness Table

All 7 server call sites. ✓ = populated, ✗ = missing, — = N/A for this event.

| # | Site (file:line) | Event | contentIds | contents | value | currency | userData (em/ph/fn/ln/ct/country/external_id) | context (fbp/fbc/IP/UA/eventSourceUrl) | eventId (dedup) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `payment/service.ts:291` (post-Task-1) | **Purchase** (Ziina/Tabby/Tamara webhook) | ✓ | ✓ | ✓ `order.total` | ✓ `CURRENCY` | ✓ all 7 (em/ph/fn/ln/ct/state/zp/country/external_id) | ✓ all 5 (rehydrated from `order.capiContext`, falls back to `order.fbp`/`fbc`) | ✓ `order_${order.id}` |
| 2 | `order/service.ts:282` (post-Task-1) | **Purchase** (COD) | ✓ | ✓ | ✓ `grandTotal` | ✓ | ✓ all 7 | ✓ all 5 (live `capiCtx`) | ✓ `order_${order.id}` |
| 3 | `analytics/index.ts:160` | **AddToCart** | ✓ `body.contentIds` | ✗ | ✓ `body.value` (optional) | default `CURRENCY` | ✗ no `em`/`ph`/`fn`/`ln` — only IP/UA/fbp/fbc available on anonymous cart-add | ✓ fbp/fbc/IP/UA/eventSourceUrl | ✓ `body.eventId` |
| 4 | `analytics/index.ts:211` | **RemoveFromCart** (custom) | ✓ | ✗ | ✓ | default | ✗ no PII (anonymous) | ✓ all 5 | ✓ `body.eventId` |
| 5 | `analytics/index.ts:334` | **InitiateCheckout** | ✓ `body.contentIds` | ✗ | ✓ `body.cartTotal` | default | ✗ no PII (anonymous at this stage) | ✓ all 5 | ✓ `body.eventId` |
| 6 | `auth/index.ts:22` | **CompleteRegistration** | — | — | — | — | ✓ em/ph/fn/ln (no ct/country/external_id) | ✓ all 5 | ✓ `register_${user.id}` |
| 7 | `contact/index.ts:19` | **Lead** | — | — | — | — | ✓ em/ph/fn/ln (split from `body.name`) | ✓ all 5 | ✓ `body.eventId` |

### Notes on table
- **Sites 3, 4, 5 are anonymous** — no logged-in user PII is on the request because cart/checkout-view endpoints accept anonymous traffic. This is a fundamental design choice: AddToCart/InitiateCheckout fire BEFORE the user enters the checkout form, so `em`/`ph` aren't yet known. **Advanced Matching on the browser Pixel side** (`setPixelUser` via `auth-context.tsx:84-90`) compensates by attaching `em`/`ph` to the browser event for logged-in users — Meta then dedupes and merges the server's no-PII event with the browser's PII-bearing event. ✓ The architecture is correct.
- **Sites 3, 4, 5 don't pass `contents`.** Guide §4.5 shows `contents` on AddToCart but Meta accepts either form (`content_ids` alone is sufficient). The client `fbAddToCart` DOES send `contents` (`facebook-pixel.ts:128-133`); the server doesn't, which means the dedup'd event may lose `contents` if Meta keeps the server version. Minor; flagged in §5 P3.
- **Sites 6, 7** are PII-only events with no commerce data — `contents`/`value` are correctly omitted.
- **Currency default:** Sites 3-7 use the `currency = CURRENCY` default parameter in `sendMetaEvent` (`meta-capi.ts:184`) rather than passing explicitly. Functionally fine for a UAE-only store; the default is centralized so a future multi-currency path can change one line.

---

## 4. Redirect Flow Trace (per PSP)

The concern: after InitiateCheckout, the browser leaves `capellauae.com` for the PSP's domain (`ziina.com` / `tabby.ai` / `tamara.co`), then returns to `/checkout/success` (or `/checkout/cancel`). Verify no CAPI context, Pixel identity, or attribution is lost in the round-trip.

### Common preconditions (all PSPs)
- `_fbp` cookie: host-only on `capellauae.com` (set by `fbevents.js`). Survives same-domain redirects. ✓
- `_fbc` cookie (browser-set): host-only on `capellauae.com`. Survives if not expired (7-day ITP cap on iOS Safari). ✓/◐
- `_fbc` cookie (API-host, set by `onAfterHandle` hook at `apps/backend/src/index.ts:86-106`): on the API subdomain, `HttpOnly`, 90-day `Max-Age`. PSP cannot clear it. ✓
- `x-fbp`/`x-fbc` headers: spread into every `apiClient` call (`api-client.ts:41`). ✓

### 4.1 Ziina

| Step | What happens | Verified? |
|---|---|---|
| 1 | User on `capellauae.com/<locale>/checkout`. `trackCheckoutView` fires on mount (`checkout/client.tsx:142`) → `fbInitiateCheckout` (browser) + POST `/api/analytics/track/checkout-view` (CAPI). Shared `eventId` via body. ✓ InitiateCheckout has full browser context. | ✓ |
| 2 | User clicks "Pay with Ziina". `useCheckoutSubmit.handleSubmit` POSTs to `/api/payments/checkout` via `apiPost` (`use-checkout-submit.ts:110-114`). `apiClient` auto-includes `credentials`, `referrerPolicy`, and `x-fbp`/`x-fbc` headers. | ✓ |
| 3 | Backend `payment/index.ts:40-54` calls `extractCapiContext(request)` → passes to `createCheckoutSession` → `createZiinaCheckout` → `prepareOrder(body, userId, "ZIINA", capiCtx)`. | ✓ |
| 4 | `prepareOrder` (`payment/service.ts:55-174`): creates Order with `capiContext: capiMetadataFields(capiCtx)` (line 151-153) — persists all 5 fields (fbp/fbc/IP/UA/eventSourceUrl) to the DB. Also persists `order.fbp`/`order.fbc` legacy columns (line 149-150) as fallback. | ✓ |
| 5 | `createZiinaCheckout` constructs `success_url = ${marketingUrl}/${lang}/checkout/success?payment_intent_id={PAYMENT_INTENT_ID}` (`payment/service.ts:403-405`). Ziina replaces the placeholder. | ✓ |
| 6 | Backend returns `{ url: paymentIntent.redirect_url, orderId }`. Client `use-checkout-submit.ts:127-130` does `window.location.href = data.data.url; return;` — browser navigates to Ziina's hosted page. | ✓ |
| 7 | **Cookie survival during redirect to ziina.com:** `_fbp`/`_fbc` on `capellauae.com` are not sent to ziina.com (correct — they wouldn't cross domains anyway). They remain intact in the browser for when the user returns. | ✓ |
| 8 | User completes payment on Ziina. | — (out of our control) |
| 9 | **Ziina redirects back** to `capellauae.com/<lang>/checkout/success?payment_intent_id=<id>`. Browser re-sends `_fbp`/`_fbc` cookies for `capellauae.com` (same domain). | ✓ |
| 10 | Success page (`checkout/success/page.tsx`): `isTabby=false`, so on mount it clears the cart and shows success UI. **Does NOT call `trackOrderComplete` or `fbPurchase`** — server-only Purchase pattern. No `apiPost` to backend from this page (no verify call). | ✓ (correct) |
| 11 | **Webhook (asynchronous, server-to-server):** Ziina POSTs `/api/payments/webhook` → `handleWebhook` (`payment/index.ts:55-86` → `service.ts:427-488`). On `intent.status === "completed"`, looks up order with `include: { items, user, address, coupon }` and calls `markOrderPaid`. | ✓ |
| 12 | `markOrderPaid` (`payment/service.ts:181-319`): idempotency guard (line 187-191), stock decrement, status → CONFIRMED, then `capiContextFromOrder(order)` rehydrates the persisted context (line 276). | ✓ |
| 13 | Purchase fires via `sendMetaEvent` (line 291, post-Task-1) with: persisted fbp/fbc/IP/UA/eventSourceUrl, full customer PII from `order.user` / guest fields, deterministic `eventId: order_${order.id}`, content_ids/contents/numItems from `order.items`. | ✓ |
| 14 | **Race condition (webhook vs. user landing):** Ziina webhook typically fires within seconds of payment. Even if the webhook arrives before the user lands on the success page, there's no double-Purchase risk: success page doesn't fire `fbPurchase`, and webhook's idempotency guard at `payment/service.ts:187-191` blocks duplicate confirmations. | ✓ |

**Ziina verdict: NO data loss.** The redirect round-trip preserves `_fbp`/`_fbc` (same-domain cookies), persisted `capiContext` carries IP/UA/eventSourceUrl through, and Purchase fires with rehydrated context.

### 4.2 Tabby

| Step | What happens | Verified? |
|---|---|---|
| 1-4 | Same as Ziina (InitiateCheckout on /checkout mount; POST `/api/payments/checkout`; backend persists `order.capiContext` via `prepareOrder`). | ✓ |
| 5 | `createTabbyCheckout` constructs `merchant_urls.success = ${marketingUrl}/${lang}/checkout/success?method=TABBY` (`payment/service.ts:646`). **Note:** Tabby appends `&payment_id=<id>` to the success URL itself. | ✓ |
| 6 | Backend returns `{ url: webUrl, orderId }`. Client redirects via `window.location.href`. | ✓ |
| 7 | User pays on `tabby.ai`. Cookies on `capellauae.com` preserved. | ✓ |
| 8 | Tabby redirects back to `capellauae.com/<lang>/checkout/success?method=TABBY&payment_id=<id>`. | ✓ |
| 9 | Success page: `isTabby=true` (because `payment_id` is in URL). Enters `"confirming"` phase. Polls `/api/payments/tabby/status?payment_id=...` every 2.5s for up to 45s (`checkout/success/page.tsx:52-100`). | ✓ |
| 10 | **Poll request includes `capiHeaders()`** via `apiClient` (the GET at `success/page.tsx:63-65` uses `apiGet`). Headers `x-fbp`/`x-fbc` are forwarded. **Referer = `capellauae.com/<lang>/checkout/success`** (the page initiating the fetch), NOT `tabby.ai` — `fetch` Referer is the document URL, not the navigation referrer. | ✓ |
| 11 | **`getTabbyOrderStatus`** (`payment/service.ts:535-543`) is read-only — just `prisma.order.findUnique(... select: status)`. Fires NO Meta event. The `capiHeaders` on this request are unused (no `extractCapiContext` call). | ✓ (correct) |
| 12 | Once order status is CONFIRMED, success page clears cart and shows success. **Does NOT fire `fbPurchase`.** | ✓ (correct) |
| 13 | **Webhook (parallel):** Tabby POSTs `/api/payments/tabby/webhook` → `handleTabbyWebhook` (`payment/index.ts:87-112` → `service.ts:675-772`). Handler ALWAYS re-fetches payment status from Tabby API (server-to-server verify, line 717) — does not trust the webhook body alone. | ✓ |
| 14 | If status is `AUTHORIZED`: calls `TabbyClient.capturePayment` (line 737). If capture fails because a concurrent webhook already captured (status now CLOSED), re-fetches and proceeds (line 744-748). If genuine capture failure: sends alert email, returns without confirming (line 750-756). | ✓ |
| 15 | `markOrderPaid(order, ...)` called (line 754) with the same rehydration pattern as Ziina. Purchase fires with persisted context + content_ids (post-Task-1). | ✓ |
| 16 | **Race condition (success-page poll vs. webhook):** Tabby's success_url and the webhook are independent. Whichever fires `markOrderPaid` first wins; the second is blocked by the `TERMINAL_STATUSES` guard at `payment/service.ts:187-191`. Even if both somehow passed the guard (e.g. process restart between the status check and the update), Meta would dedupe via `event_id: order_${order.id}`. | ✓ |
| 17 | **Tabby capture is webhook-only**, never browser-triggered. The success page's poll is read-only. Capture failure paths don't fire Purchase (correct — payment wasn't captured). | ✓ |

**Tabby verdict: NO data loss.** Identical to Ziina + extra safety from the server-to-server status verify. The poll from the success page is read-only and doesn't affect attribution.

### 4.3 Tamara

| Step | What happens | Verified? |
|---|---|---|
| 1-4 | Same as Ziina/Tabby (InitiateCheckout on /checkout; POST `/api/payments/checkout`; backend persists `order.capiContext`). | ✓ |
| 5 | `createTamaraCheckout` constructs `merchant_url.success = ${marketingUrl}/${localePath}/checkout/success?method=TAMARA` (`payment/service.ts:916`). | ✓ |
| 6 | Backend returns `{ url: checkout.checkout_url, orderId }`. Client redirects. | ✓ |
| 7 | User pays on `tamara.co`. Cookies preserved. | ✓ |
| 8 | Tamara redirects back to `capellauae.com/<lang>/checkout/success?method=TAMARA`. **Note:** no `payment_id` or `payment_intent_id` in URL → `isTabby=false` → success page treats it like Ziina (clears cart, shows success, no polling). | ✓ |
| 9 | **Webhook:** Tamara POSTs `/api/payments/tamara/webhook` → `handleTamaraWebhook` (`payment/index.ts:113-124` → `service.ts:940-996`). Handler parses `order_reference_id` (our `order.id`) and calls `TamaraClient.getOrderStatus(orderReferenceId)` for authoritative status (line 960). | ✓ |
| 10 | If status `approved`/`authorised`: calls `TamaraClient.capturePayment` (line 975). Capture failure is logged but does NOT block `markOrderPaid` (line 980-982) — **slight difference from Tabby.** If capture genuinely fails, the order is still marked paid (and Purchase fires), but Tamara won't have settled the funds. This is a business-logic risk, not a CAPI risk. | ◐ (capture-error handling looser than Tabby) |
| 11 | `markOrderPaid` called (line 982). Purchase fires with rehydrated context + content_ids (post-Task-1). | ✓ |
| 12 | Idempotency guard at `payment/service.ts:187-191` blocks duplicate webhooks. | ✓ |

**Tamara verdict: NO data loss for CAPI.** Capture-failure handling is more permissive than Tabby (markOrderPaid proceeds even if capture fails), but this is a payment-ops concern, not a Meta measurement concern.

### 4.4 Cookie/header survival summary

| Signal | Survives the redirect round-trip? | Why |
|---|---|---|
| `_fbp` (browser cookie on `capellauae.com`) | ✓ | Same-domain; PSP redirect doesn't touch it |
| `_fbc` (browser cookie on `capellauae.com`, set by Pixel) | ✓ (7-day ITP cap on Safari) | Same-domain |
| `_fbc` (API-host cookie, set by `onAfterHandle`) | ✓ (90-day Max-Age) | Different subdomain; PSP cannot clear |
| `x-fbp` / `x-fbc` headers on `apiClient` calls | ✓ | Spread into every fetch at `api-client.ts:41` |
| `fbclid` URL param | ✗ (expected) | Was on the ad-landing URL, not propagated to checkout. Attribution carried by `_fbc` (or its API-host clone), not the URL param. ✓ |

### 4.5 The InitiateCheckout dedup question (Task 3 critical check)

> *"Is the `event_id` for InitiateCheckout shared between the browser Pixel and CAPI?"*

**Yes — but via the body, not via the `x-fb-event-id` header.**

- Client generates `eventId = genEventId()` once in `analytics.ts:234`.
- Forwards the SAME id to BOTH:
  - `fbInitiateCheckout({ ..., eventId })` → `fbq('track', 'InitiateCheckout', ..., { eventID: eventId })` (`facebook-pixel.ts:184-185`).
  - `trackEvent("checkout-view", { ..., eventId })` → POST `/api/analytics/track/checkout-view` with `eventId` in the body (`analytics.ts:236-243`).
- Backend `analytics/index.ts:332-348` reads `body.eventId`, only fires CAPI if present, and passes `eventId: capiCtx.eventId || body.eventId` to `sendMetaEvent`.

**Caveat:** the canonical guide pattern forwards the id via the `x-fb-event-id` HTTP header (read by `extractCapiContext`). The current implementation uses the body instead. Both work — `extractCapiContext` reads header-first (`meta-capi.ts:105`), and the call sites fall back to `body.eventId`. Functionally equivalent. **No fix needed.**

**The actual `/payments/checkout` POST** (the one that triggers the redirect) does NOT need an `eventId` because **no InitiateCheckout fires at that moment** — InitiateCheckout already fired when the user first landed on `/checkout`. The redirect-critical POST just creates the order; no Meta event is sent on it.

---

## 5. Remaining Gaps (Ranked by Severity)

After Task 1 + Stages A–H, the integration is in strong shape. Three remaining items, all P2 or lower:

### P2-1: Migration not applied to DB — **BLOCKER for the webhook Purchase fix to actually work**

- **Finding:** `prisma migrate status` reports `20260728000000_add_order_capi_context` AND `20260703000000_add_tabby_tamara_payment_ids` as not yet applied to the connected Neon database (`neondb`).
- **File:line:** `apps/backend/prisma/migrations/20260728000000_add_order_capi_context/migration.sql` (file exists; DB column missing).
- **Impact:** If the code is deployed before the migration is applied, writes to `order.capiContext` will silently fail (Prisma 7+ behavior on missing columns is typically a runtime error, which would surface in webhook logs but not break the order — because `capiMetadataFields(capiCtx)` returns `{}` if `capiCtx` is undefined, and the write of `capiContext: {}` is gated by `Object.keys(...).length > 0` at `payment/service.ts:151-153`). The practical effect: webhook Purchase fires with the bare-columns fallback (fbp/fbc only) → **the entire Phase 1 EMQ cliff fix is silently neutralized.** Worse: `tabbyPaymentId` and `tamaraCheckoutId` columns are also missing → Tabby/Tamara lookups (`prisma.order.findUnique({ where: { tabbyPaymentId }})`) would throw `Unknown column` errors and the webhooks would 500.
- **Recommended fix:** Run `bunx prisma migrate deploy` against production before/with the deploy of these commits. **Do this FIRST** — before the code is live.
- **Severity:** P2 (only because production isn't deployed yet; becomes P0 the moment the code ships without the migration).

### P2-2: Online-payment (Ziina/Tabby/Tamara) Purchase has no browser-side event for dedup

- **Finding:** Per the intentional design (`checkout/success/page.tsx` does NOT call `fbPurchase`), the Purchase event for online payments is **server-only**. Meta receives exactly one Purchase per order via CAPI. There is no browser Purchase to dedupe against.
- **File:line:** `apps/marketing/src/app/[locale]/checkout/success/page.tsx` (entire file — no Purchase fire).
- **Impact:** For online-payment orders, the "Browser" count for Purchase in Events Manager will be 0%. This is fine for EMQ (server-side has richer PII), but loses two things:
  1. **Dual-channel redundancy** — if CAPI is rate-limited or fails after 3 retries, the conversion is lost entirely (no browser fallback).
  2. **Browser-side dedup signal** — Meta's dedup requires both channels; with only one, the "Deduplicated" metric will appear lower (though it's actually N/A).
- **Guide verdict:** This matches the guide's explicit recommendation ("Online-payment success page does NOT fire `fbPurchase` — server-only Purchase is the correct pattern when the user leaves the site"). The architecture is intentional and correct.
- **Optional enhancement:** If dual-channel redundancy is desired, the success page could fire `fbPurchase` with `eventID: order_${orderId}` AFTER the Tabby poll confirms CONFIRMED status (and for Ziina/Tamara, optimistically on landing). The deterministic id guarantees Meta dedupes the browser event with the already-fired server event. **Trade-off:** a tiny risk of double-counting if Meta's dedup glitches. **Recommendation:** leave as-is unless Events Manager shows CAPI reliability problems.
- **Severity:** P2 (informational; architecture is intentional).

### P3-1: InitiateCheckout / RemoveFromCart / Lead / CompleteRegistration don't send `contents`

- **Finding:** The 5 non-Purchase `sendMetaEvent` sites that DO carry `contentIds` (AddToCart, RemoveFromCart, InitiateCheckout) don't pass the structured `contents` array. The client Pixel helpers DO send `contents` for AddToCart (`facebook-pixel.ts:128`) but not for InitiateCheckout (`:177-182`) or AddPaymentInfo (`:199-203`).
- **File:line:** `apps/backend/src/modules/analytics/index.ts:160-173` (AddToCart), `:211-224` (RemoveFromCart), `:334-347` (InitiateCheckout); `apps/marketing/src/lib/facebook-pixel.ts:177-182` (client InitiateCheckout).
- **Impact:** Meta accepts either `content_ids` alone or with `contents`. The dedup'd event may pick the server (no `contents`) version over the browser (with `contents`) version, slightly weakening catalog correlation signal. DPA Performance impact: small to none.
- **Recommended fix:** When CAPI is later enhanced for these events, extend `buildCapiItems` usage or accept a `contents` field in the body schema. Not urgent — YAGNI until DPA performance proves insufficient.
- **Severity:** P3 (YAGNI-gated).

### What is NOT a remaining gap

For completeness, these were checked and are **not** problems:

- ❌ **Buy Now flow parity:** "Buy Now" reuses the standard `/checkout` page with `isBuyNow=true` and `buyNowItem` as the only cart item (`checkout/client.tsx:44-48`). Same `useCheckoutSubmit`, same `trackCheckoutView`, same persistence path, same webhook Purchase. No separate endpoint to audit. ✓
- ❌ **`wasAlreadySucceeded` / idempotency guard:** `TERMINAL_STATUSES` includes `CONFIRMED` (and 5 others) at `payment/service.ts:187`. Guards stock decrement, coupon increment, emails, and Purchase. Resilient to duplicate webhooks. ✓
- ❌ **CORS allowlist + regex:** `apps/backend/src/index.ts:38-54` covers production, staging, dashboard, localhost, and `*.capellauae.com` PR previews. ✓
- ❌ **Test-event-code prod guard:** `meta-capi.ts:204-213` ignores the code in prod with per-call warn; `index.ts:159-164` adds boot-time warn. Stricter than guide. ✓
- ❌ **Logging hygiene:** `meta-capi.ts:295-318` — no PII in logs; email/phone masked as `"***"`; dedup log line carries only non-identifying fields. ✓
- ❌ **Currency centralization:** `CURRENCY` constant in `shared-utils/src/meta.ts:11`, imported everywhere. ✓
- ❌ **Content-id parity:** `toContentId` in shared-utils, used by catalog feed (`meta-catalog/service.ts:160`), client Pixel helpers (`analytics.ts`), and (post-Task-1) server Purchase. ✓
- ❌ **Phone normalization parity:** `normalizePhone` in shared-utils, imported on both client (`facebook-pixel.ts:6`) and server (`meta-capi.ts:7`). ✓
- ❌ **Country code:** `DEFAULT_COUNTRY = "AE"` flows through to `sha256("ae")`. ✓

---

## 6. Migration Status

```
$ bunx prisma migrate status
Datasource "db": PostgreSQL database "neondb" at "...neon.tech"

9 migrations found in prisma/migrations
Following migrations have not yet been applied:
  20260703000000_add_tabby_tamara_payment_ids
  20260728000000_add_order_capi_context
```

| Migration | Adds | Status | Impact if shipped without apply |
|---|---|---|---|
| `20260703000000_add_tabby_tamara_payment_ids` | `orders.tabbyPaymentId` (String, unique), `orders.tamaraCheckoutId` (String, unique) | **NOT APPLIED** | Tabby/Tamara webhook handlers will throw on `findUnique({ where: { tabbyPaymentId } })`. Webhook 500s. **Critical** — Tabby/Tamara purchases would fail to confirm. |
| `20260728000000_add_order_capi_context` | `orders.capiContext` (JSONB, nullable) | **NOT APPLIED** | Writes to `capiContext` at `payment/service.ts:151-153` will throw. The `Object.keys(...).length > 0` gate means no write happens when `capiCtx` is empty, but if `capiCtx` has any field, the entire `prisma.order.create` will fail → **all online-payment checkout creation breaks**. |

> **Note:** The DB inspected is the dev/staging Neon instance (`neondb`). Production DB state could not be verified from this environment. **Operator must run `bunx prisma migrate deploy` (or equivalent in CI/CD) against production before these commits are deployed.** If production is already running Tabby/Tamara (which the code implies), the production DB likely already has those columns — meaning only `capiContext` is at risk.

**Recommendation:** Treat migration apply as a deploy prerequisite, not a post-deploy cleanup. Order:
1. `bunx prisma migrate deploy` (apply both pending migrations).
2. Verify `capiContext` column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'capiContext';`.
3. Deploy the code (Stages A–H + Task 1).
4. Validate in Events Manager (§7).

---

## 7. Recommendations (Next Steps)

### Immediate (pre-deploy) — **DO NOT SKIP**

1. **Apply the pending Prisma migrations** to production (`bunx prisma migrate deploy`). Without this, both the Task 1 fix and the entire Phase 1 webhook-context rehydration are silently broken, and Tabby/Tamara webhooks will 500.
2. **Re-confirm production env vars:** `META_PIXEL_ID`, `META_ACCESS_TOKEN` set; `META_TEST_EVENT_CODE` empty/unset.
3. **Catalog feed re-upload** in Commerce Manager. The `cap-<sku||id>` scheme is unchanged by Task 1, but if the feed is stale, run a fresh fetch so Meta's side has up-to-date `id` values matching the new Purchase payloads.

### Deploy + validate (first 24h)

4. **Watch the dedup log line.** Every server event now logs `[CAPI] dispatch event=Purchase event_id=order_<id> src=webhook order=<id> fbp_present=true fbc_present=true value=... AED` (or `src=cod`). For the first ~10 Purchases, grep the logs and confirm `fbp_present=true` on at least 80%. If `fbp_present=false` on most events, the cross-origin identity backbone isn't working in prod — re-check `capiHeaders()` and CORS in the live environment.
5. **Events Manager → Test Events** (server tab, with `META_TEST_EVENT_CODE` set in a staging env): complete a Ziina/Tabby/Tamara/COD test purchase. Verify the server Purchase payload includes:
   - `user_data.em` / `ph` / `fn` / `ln` / `ct` / `country` / `external_id` / `fbp` / `fbc` / `client_ip_address` / `client_user_agent`
   - `custom_data.content_ids = ["cap-<sku>", ...]` ← Task 1 verifies here
   - `custom_data.contents = [{id, quantity, item_price}, ...]` ← Task 1 verifies here
   - `custom_data.num_items`, `content_type: "product"`, `value`, `currency: "AED"`
   - `event_source_url` = the actual checkout page URL
6. **After 24h of live traffic:** check Events Manager → Purchase event:
   - Server count > 0 (CAPI working).
   - Browser count > 0 for COD orders (client `fbPurchase` working).
   - "Deduplicated" ratio > 80% for COD (client + server dedup working).
   - Sample server Purchase → confirm `fbp` and `fbc` populated (cross-origin identity working).

### 7–14 days post-deploy

7. **Funnel monotonicity check:** in Events Manager, compare EMQ scores:
   - `ViewContent` (browser-only) < `AddToCart` < `InitiateCheckout` ≤ `Purchase`.
   - If `Purchase EMQ < InitiateCheckout EMQ`, re-check `capiContext` column population (sample 5 webhook-paid orders in the DB and verify `capiContext` JSON is non-null and contains `clientIpAddress` + `clientUserAgent`).
8. **Catalog correlation:** Commerce Manager → Catalog → "Events received for these items". Should now show Purchase events being attributed to variants (was likely near-empty before Task 1).
9. **ROAS / CPA sanity:** 7-day rolling ROAS should be stable or improving; no sudden drop (a drop to ~0 means `META_TEST_EVENT_CODE` leaked into prod).

### Optional / YAGNI-gated (only if metrics show a problem)

10. **Dual-channel Purchase for online payments** (P2-2): if CAPI reliability proves poor in prod (server counts dropping below 95% of dedup'd total), add a browser `fbPurchase` call to the success page after the Tabby poll confirms (or optimistically for Ziina/Tamara). Use `eventID: order_${orderId}` for dedup.
11. **`contents` propagation to non-Purchase events** (P3-1): if DPA performance is weak, extend `buildCapiItems` to AddToCart/InitiateCheckout.

---

*End of audit. Generated after Stages A–H + Task 1 (Purchase `content_ids` fix). Integration is production-ready pending migration apply.*
