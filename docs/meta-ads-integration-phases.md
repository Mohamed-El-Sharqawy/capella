# Meta Ads (Pixel + Conversions API) — Phased Remediation Plan

> Audit of the **actual** production codebase in this repo (`apps/marketing` Next.js client + `apps/backend` Elysia/Bun) against the gold standard in [`docs/meta-ads-integration-guide.md`](./meta-ads-integration-guide.md) (cited throughout as "guide §N").
>
> **Critical drift note (read first).** The guide describes a *fictional bookstore* (`book_<id>` / `collection_<id>` / `game_<id>` content_ids, Stripe + Tabby + COD payments, file paths like `client/lib/...` and `backend/src/lib/facebook-capi.ts`). The **actual** repo is a **UAE jewelry store** (`capellauae.com`, AED) using **Ziina + Tabby + Tamara + COD** payments, with code under `apps/marketing/src/...` and `apps/backend/src/...`, and a CAPI core at `apps/backend/src/lib/meta-capi.ts`. Several canonical files the guide cites (`capi-headers.ts`, `FacebookPixel.tsx`, `facebook-capi.ts`, `tabby-service.ts`, `services/cart/api.ts`, `services/payment/api.ts`) **do not exist** in this repo — they are aspirational, not actual. This plan audits what is *actually in the repo* and converges it toward the guide's *principles* (not its bookstore-specific examples).
>
> The audit also incorporates and supersedes the older root-level reviews `META_PIXELS_&_CAPI_REVIEW.md` and `META_EVENTS_ARCHITECTURE.md`. Where those flagged issues that have since been fixed, this plan records them as resolved.

---

## A. Executive Summary

**Current overall EMQ-health score: 55 / 100.**

The fundamentals are unusually strong for a self-built Pixel+CAPI setup: per-field PII normalization (`meta-capi.ts:14-43`), SHA-256 hashing, deterministic `order_<id>` Purchase ids across COD + every webhook path (`order/service.ts:282`, `payment/service.ts:281`), a real webhook idempotency guard that includes `CONFIRMED` (`payment/service.ts:179-183`), retry/backoff with exponential delay (`meta-capi.ts:186-230`), a production test-event-code guard that is stricter than the guide (`meta-capi.ts:104-109`), a `hasMatchableKey` rejector (`meta-capi.ts:135-146`), masked PII in logs (`meta-capi.ts:172-182`), and a working client-generated `eventId` shared with the server for AddToCart / InitiateCheckout / Lead / CompleteRegistration (`analytics.ts:64-69, 133, 165, 222`). The dual-channel dedup contract is, for the events it covers, correctly implemented — a meaningful improvement over the prior review's F1.

What is **missing** is the entire **cross-origin identity backbone** that the guide calls "the single highest-value fix" (guide §5, §7). The CORS config sets `credentials: false` (`backend/src/index.ts:43`), no client `fetch` sets `credentials: 'include'` or `referrerPolicy: 'no-referrer-when-downgrade'` (`api-client.ts:46-49`, `analytics.ts:46-55`, `use-contact-form.ts:33-37`), and there is no `x-fbp` / `x-fbc` header helper at all — fbp/fbc only reach the server when individual call sites remember to put `getFbp()` / `getFbc()` into the request **body**. The fbclid→`_fbc` server-side capture hook (guide §7) is entirely absent, so ad-click attribution is fragile (ITP / ad-blockers / iOS 14+). Webhook-sourced Purchases persist only `fbp`/`fbc` on the order, not IP/UA/`event_source_url`, so the most valuable event (Purchase) ships with less context than the guide requires for `action_source: "website"`. There are also two silent data-quality bugs that drop EMQ on **every** Purchase: `shippingCountry` defaults to the literal string `"United Arab Emirates"` (`checkout/constants.ts:15`) which Meta cannot match (it expects ISO alpha-2 `"ae"`), and the client-side Pixel Advanced Matching passes the phone **un-normalized** (`facebook-pixel.ts:50`) while the server normalizes — so the two `ph` hashes never agree and Meta drops the match.

### Top 5 highest-impact problems (ranked by EMQ / conversions leverage)

1. **Cross-origin identity backbone is absent.** `credentials: false` in CORS + zero `credentials`/`referrerPolicy` on any client `fetch` + no `x-fbp`/`x-fbc` headers. `_fbp`/`_fbc` only survive via the fragile body-passing workaround. (F1, F2, F3)
2. **No fbclid → `_fbc` server-side capture.** Guide §7 entirely unimplemented. Ad-click attribution for deferred purchases (the highest-value conversions) is fragile against ITP, ad-blockers, and iOS 14+. (F9)
3. **Webhook Purchase is context-starved.** Only `fbp`/`fbc` are persisted on the Order; `client_ip_address`, `client_user_agent`, and the real `event_source_url` are gone. Classic cause of "Purchase EMQ < InitiateCheckout EMQ". (F4, F10)
4. **`country = "United Arab Emirates"` instead of `"ae"`.** Every Purchase event's `country` is silently dropped by Meta. (F5)
5. **Client Pixel `ph` is un-normalized.** Advanced Matching phone hashes never match the server's normalized+hashed phone → `ph` lost on every browser event for logged-in users. (F6)

### Expected EMQ lift if all phases complete

- **Purchase EMQ**: from current ~4.5–5.5 / 10 → **7.5–8.5 / 10** (the optimization event; biggest CPA/scaling lever).
- **InitiateCheckout EMQ**: ~5 / 10 → **7.5 / 10**.
- **AddToCart EMQ**: ~4 / 10 → **6.5–7 / 10**.
- Funnel monotonicity restored (Purchase ≥ InitiateCheckout).
- Ad-click attribution survival extended from 7 days (ITP cap) to 90 days.
- Catalog correlation unlocked for Dynamic Product Ads (content_id parity).

---

## B. Audit Findings

### Legend — Severity

| Sev | Meaning |
|---|---|
| **P0** | Actively breaking dedup / EMQ / attribution, or losing conversions right now. |
| **P1** | Significant, ongoing EMQ drag; depresses optimization quality every day. |
| **P2** | Hygiene / resilience / data-quality issue; meaningfully weakens signal but not catastrophic. |
| **P3** | Enhancement / nice-to-have / future-proofing. |

### Findings table

| ID | Sev | Area | Finding | File:line | Phase |
|---|---|---|---|---|---|
| F1 | **P0** | Cross-origin identity | CORS sets `credentials: false` — browser will not send cross-origin cookies (`_fbp`, `_fbc`, auth) even when client sets `credentials: 'include'`, and server will not emit `Access-Control-Allow-Credentials: true`. This is the master break that disables every cookie-based identity path. Guide §6 makes `credentials: true` a non-negotiable. | `apps/backend/src/index.ts:42-47` | P0 |
| F2 | **P0** | Cross-origin identity | The centralized client `apiClient` (used by every `apiGet/apiPost/apiPut/apiPatch/apiDelete`) sets neither `credentials: 'include'` nor `referrerPolicy: 'no-referrer-when-downgrade'`. Combined with F1, browser cookies never reach the API; Next.js's default `strict-origin-when-cross-origin` policy also strips `?fbclid=…` from the Referer, killing any future server-side fbclid recovery. Guide §5/§7. | `apps/marketing/src/lib/api-client.ts:46-49, 75-78` | P0 |
| F3 | **P0** | Cross-origin identity | No `capi-headers.ts` helper exists. The guide's §5 cross-origin trick (read `_fbp`/`_fbc` from `document.cookie`, lift into `x-fbp`/`x-fbc` headers that cross origins freely) is **not implemented anywhere**. fbp/fbc only reach the server when individual call sites manually put `getFbp()`/`getFbc()` into the request body — fragile and incomplete (e.g. `trackProductView`, `trackSearch`, `trackWishlistToggle`, `trackCheckoutStep`, `trackCheckoutAbandon`, `trackOrderComplete` do not forward them). | `apps/marketing/src/lib/meta-cookies.ts:1-11` (exists, body-only); canonical `capi-headers.ts` absent | P0 |
| F4 | **P0** | Webhook context round-trip | On Ziina/Tabby/Tamara webhook Purchase, only `order.fbp`/`order.fbc` are recovered from the DB. `client_ip_address`, `client_user_agent`, and the actual `event_source_url` are **not persisted at checkout creation** and are therefore absent on the webhook path. Guide §10 makes this the #1 fix for "Purchase EMQ < InitiateCheckout EMQ". `event_source_url` is hardcoded to `${MARKETING_URL}/checkout` rather than the real page URL. | `apps/backend/src/modules/payment/service.ts:144-145` (only fbp/fbc persisted), `:267-285` (Purchase sent with order.fbp/fbc only, no IP/UA), `:284` (hardcoded URL) | P1 |
| F5 | **P0** | Data quality | `DEFAULT_COUNTRY = "United Arab Emirates"` is the literal full country name, not ISO alpha-2. `normalizeCountry` (`meta-capi.ts:41-43`) only lowercases+trims, producing `"united arab emirates"`, which Meta cannot match against its `"ae"` expectation → the hashed `country` field is **silently dropped on every event**. Guide §8.4 requires ISO alpha-2. | `apps/marketing/src/app/[locale]/checkout/constants.ts:15` (source), `apps/backend/src/lib/meta-capi.ts:41-43, 123` (consumer) | P2 |
| F6 | **P1** | Client `ph` normalization | `setPixelUser` passes `user.phone` **raw** into `fbq('init', …, { ph })`. The Pixel SDK hashes it as-is, but the value is not E.164-normalized (e.g. `0501234567` stays `0501234567`), while the server normalizes to `971501234567` before hashing. The two SHA-256 outputs never agree → Meta drops the `ph` match on every browser event for logged-in users. Guide §4.6 mandates a client-side `normalizePhone` mirroring the server's. No `normalizePhone` exists on the client (grep confirms zero matches). | `apps/marketing/src/lib/facebook-pixel.ts:40-58` (no normalization), `apps/marketing/src/contexts/auth-context.tsx:84-90` (caller) | P2 |
| F7 | **P1** | Webhook idempotency | Resolved since the prior review's F2: `TERMINAL_STATUSES` now includes `CONFIRMED`, so webhook replays skip stock decrement, coupon increment, emails, and the server Purchase. ✓ **No action needed** — recorded for completeness. | `apps/backend/src/modules/payment/service.ts:179-183` | — |
| F8 | **P1** | Catalog content_id parity | The Meta Commerce catalog feed builds product `id` as `cap-${variant.sku}` (or `cap-${variant.id}` fallback). But every Pixel and CAPI event sends `content_ids: [<raw variantId>]` (or `<raw productId>` for ViewContent). The two schemes never match, so Meta cannot correlate events with the catalog → Dynamic Product Ads, catalog-level reporting, and content-based EMQ inputs are broken. Guide §4.5/§8.5 require byte-for-byte parity. | Feed: `apps/backend/src/modules/meta-catalog/service.ts:158-159`. Events: `apps/marketing/src/lib/analytics.ts:141,148,228,268`, `apps/marketing/src/lib/facebook-pixel.ts:84,100,118,148,173,213` | P3 |
| F9 | **P1** | ITP / ad-blocker resilience | The guide §7 `onAfterHandle` fbclid→`_fbc` server-side cookie hook is **entirely absent**. Combined with F2 (Referer stripped), ad-click attribution depends solely on the browser Pixel writing `_fbc` — which fails under ad blockers and expires after 7 days on iOS Safari (ITP). Deferred purchases (3+ days after ad click) lose attribution entirely. | `apps/backend/src/index.ts:34-95` (no `onAfterHandle` hook present) | P4 |
| F10 | **P1** | event_source_url coverage | Most CAPI events do not set `event_source_url`: AddToCart, InitiateCheckout, RemoveFromCart (`analytics/index.ts:164-176, 217-229, 342-354`), Lead (`contact/index.ts:23-34`), CompleteRegistration/Login (`auth/index.ts:27-38, 67-78`). Only COD Purchase and webhook Purchase set it, and even there it is hardcoded to `${MARKETING_URL}/checkout` — not the actual page URL the user was on. Minor but real EMQ lift left on the table. | `apps/backend/src/lib/meta-capi.ts:165` (param exists, under-used); omitted at the 7 call sites above | P5 |
| F11 | **P2** | Browser Pixel hygiene | Pixel loader is missing the initial `fbq('track', 'PageView')` inside the snippet. Only `fbq('init', …)` + `fbq('set', 'autoConfig', 'false', …)` are emitted. PageView fires only via the SPA tracker (`page-view-tracker.tsx:12-18`) on client navigation — the very first hard-load PageView is never sent by the snippet itself. (The SPA tracker does fire on mount, so this is partly compensated, but the canonical pattern is to also fire PageView in the snippet for noscript / first-paint reliability.) Guide §4.1. | `apps/marketing/src/components/analytics/facebook-pixel.tsx:14-31` | P6 |
| F12 | **P2** | Browser Pixel hygiene | `autoConfig` is explicitly disabled (`fbq('set', 'autoConfig', 'false', …)`). Combined with F6 (client `ph` not normalized), browser-side Advanced Matching is weaker than it should be. Manual AM via `setPixelUser` is wired (`auth-context.tsx:82-94`), which is the safer pattern, but only covers em/fn/ln/external_id reliably until F6 is fixed. Guide §4.6. | `apps/marketing/src/components/analytics/facebook-pixel.tsx:28` | P6 |
| F13 | **P2** | Dedup contract | The 5 browser-only `trackEvent` calls (`product-view`, `collection-view`, `search`, `wishlist-add/remove`, `favourite-add/remove`, `order-complete`, `checkout-step`, `checkout-abandon`) do not forward fbp/fbc in their bodies. For pure-browser events this is fine (the Pixel carries its own fbp/fbc via `_fbp`/`_fbc` cookies), but `order-complete` is paired with a server Purchase via a different path — so this is harmless. Recorded as informational; **no fix required unless those endpoints ever fire CAPI** (they currently don't). | `apps/marketing/src/lib/analytics.ts:81, 101, 114, 190, 202, 245, 252, 264` | — |
| F14 | **P2** | Resilience / hygiene | `"Login"` is fired via CAPI on every sign-in. `"Login"` is **not** on Meta's standard-event list, so it cannot be selected as a campaign optimization objective — the call transmits authenticated-user PII (em/ph/fn/ln) for zero ad-delivery value. The `login_${user.id}` id is stable (✓ F12 from prior review resolved), but the call itself is budget/privacy cost with no delivery benefit. Prior review F12.1. | `apps/backend/src/modules/auth/index.ts:65-78` | P7 |
| F15 | **P2** | Security / CORS | `cors({ origin: true, … })` reflects the request Origin verbatim for **any** origin. Combined with F1's `credentials: false` this is not exploitable today (no cookies flow), but once F1 is fixed to `credentials: true`, the wide-open `origin: true` becomes a credential-bearing CSRF surface. Must be replaced with the guide's allowlist + regex pattern before flipping `credentials`. Guide §6. | `apps/backend/src/index.ts:42` | P0 (gated with F1) |
| F16 | **P3** | Graph API version | Pinned to `v21.0` default (`META_API_VERSION || "v21.0"`). Current at audit time is ~`v23.0`. v21.0 is still supported but aging; the env-override is good practice. Guide pins v23.0. | `apps/backend/src/lib/meta-capi.ts:6` | P7 |
| F17 | **P3** | Consent gating | No consent gate around Pixel load or CAPI PII. Acceptable for UAE-only (no GDPR today), but if the store ever serves EU/consent-required traffic this becomes a hard violation. Guide §17 porting note. | `apps/marketing/src/components/analytics/facebook-pixel.tsx:14-31`, `apps/backend/src/lib/meta-capi.ts:72-146` | P8 |
| F18 | **P3** | Currency explicitness | Every wrapper silently defaults `currency = "AED"` (`facebook-pixel.ts` 8 sites, `meta-capi.ts:85`). For a UAE-only store this is low-risk, but a future multi-currency path that forgets to pass currency will silently report AED and corrupt value-optimization models. Prior review F8. | `apps/marketing/src/lib/facebook-pixel.ts:88,101,122,152,175,198,217,241,257,271,292`; `apps/backend/src/lib/meta-capi.ts:85` | P8 |
| F19 | **P3** | `external_id` hashing | `externalId` is hashed via `normalizeEmail` (`trim().toLowerCase()`). For UUIDs this is harmless, but semantically wrong. Should use a dedicated normalizer (or just `trim()`). No EMQ impact today; cleanup. | `apps/backend/src/lib/meta-capi.ts:124` | P7 |

### What is already done well (do **not** break these)

- ✓ **Per-field PII normalization** — `normalizePhone`, `normalizeCity`, `normalizeZip`, `normalizeCountry`, `normalizeName`, `normalizeEmail` (`meta-capi.ts:14-43`). Resolves the prior review's F3.
- ✓ **Deterministic Purchase id** — `order_${order.id}` on COD (`order/service.ts:282`), Ziina/Tabby/Tamara webhooks (`payment/service.ts:281`), and the client `fbPurchase` (`facebook-pixel.ts:224`). All four webhook paths converge through `markOrderPaid`, guaranteeing one canonical id.
- ✓ **Webhook idempotency** — `TERMINAL_STATUSES` includes `CONFIRMED` (`payment/service.ts:179-183`). Resolves the prior review's F2.
- ✓ **Retry/backoff** — 3 attempts, exponential backoff, no retry on 4xx (except 429) (`meta-capi.ts:186-230`). Better than the guide.
- ✓ **Test-event-code prod guard** — `useTestCode = !IS_PROD && TEST_EVENT_CODE` plus a boot-time-style warning (`meta-capi.ts:104-109`). Stricter than the guide.
- ✓ **`hasMatchableKey` rejector** — events with no matchable user data are skipped with a warning (`meta-capi.ts:135-146`).
- ✓ **Logging hygiene** — PII masked as `"***"` in non-prod logs; no payload body logged (`meta-capi.ts:172-182`). Pixel logs gated to non-prod (`facebook-pixel.ts:22-24`). Resolves the prior review's F13.
- ✓ **Client-generated `eventId` shared with server** for AddToCart / InitiateCheckout / RemoveFromCart / Lead / CompleteRegistration (`analytics.ts:64-69, 133, 165, 222`). Resolves the prior review's F1.
- ✓ **Stable entity-anchored ids** — `register_${user.id}` and `login_${user.id}` (no `Date.now()`). Resolves the prior review's F12.
- ✓ **Lead uses UUID, not email** — `lead_${crypto.randomUUID()}` (`use-contact-form.ts:30-32`). Resolves the prior review's F14.
- ✓ **SPA PageView tracker** fires on `pathname` **and** `searchParams` change, deduped via ref (`page-view-tracker.tsx:7-21`). Matches guide §4.2 (slightly better — also catches search-param navigation).
- ✓ **Manual Advanced Matching wired to auth state** — `setPixelUser` / `clearPixelUser` on user change (`auth-context.tsx:82-94`). The safer alternative to AAM.
- ✓ **`fbp`/`fbc` typed in body schemas** — `OrderModel.createBody` (`order/model.ts:31-32`) and `PaymentModel.checkoutBody` (`payment/model.ts:31-32`). Resolves the prior review's F11.
- ✓ **Online-payment success page does NOT fire `fbPurchase`** — server-only Purchase is the correct pattern when the user leaves the site (`checkout/success/page.tsx`).
- ✓ **`keepalive: true` on analytics fire-and-forget** (`analytics.ts:54`) — survives page navigation.

---

## C. Recommended Execution Order

> **Do NOT execute Phase 0 → 9 linearly.** The phases are numbered by *EMQ leverage* (which problem hurts most), not by *implementation order*. Some phases have hard dependencies; others are independent and can be reordered, parallelized, or deferred under YAGNI.

### Dependency graph

```
Stage A: Quick Wins ──────────────────────────────────────────┐
  (F5 country, F1+F15 CORS, F6 normalizePhone)                │
                                                               ▼
Stage B: Phase 0 (Foundation) ────────────┬──▶ Stage C: Phase 1 (Webhook CTX) ──▶ Stage E: Phase 5 (event_source_url)
  extractCapiContext + capiHeaders()       │
  + credentials + referrerPolicy           ├──▶ Stage D: Phase 4 (fbclid→_fbc)
                                           │
                                           └──▶ Stage G: Phase 9 (verify, continuous)

Independent of Phase 0 (ship anytime):
  • Stage A already absorbed most of Phase 2 (only F19 external_id remains)
  • Phase 3 (content_id parity) — YAGNI-gated, only if running DPAs
  • Phase 6 (browser hygiene) + Phase 7 (cleanup) — bundle together
  • Phase 8 (enhancements) — YAGNI-gated, selective
```

### The recommended stage sequence

| Stage | Phase(s) | Why this order | Complexity |
|---|---|---|---|
| **A. Quick Wins** | F5, F1+F15, F6 | 5-minute fixes with outsized impact. Do **today**, before any phase. Fully independent. | S |
| **B. Foundation** | **Phase 0** | Every server-side fix depends on `extractCapiContext` + `capiHeaders()` existing. Non-negotiable first. | M |
| **C. Purchase EMQ cliff** | **Phase 1** | Highest-leverage fix for the optimization event (Purchase). Depends on Phase 0. | M |
| **D. Ad attribution** | **Phase 4** | Depends on Phase 0's `referrerPolicy`. **Parallelizable with Stage C** (different code paths) if two engineers are available. | S |
| **E. Data quality + URL coverage** | **Phase 2** (remainder) → **Phase 5** | Phase 2's country/phone fixes are already in Quick Wins; leftover F19 + Phase 5 (depends on Phase 1) bundle naturally. | S |
| **F. Browser hygiene + cleanup** | **Phase 6** → **Phase 7** | Client-side polish + dead-code removal. Independent of backend phases. Ship together. | S |
| **G. Continuous verification** | **Phase 9** (incremental) | Run the relevant Test Events check **after each stage**, not just at the end. Final comprehensive pass after Stage F. | S |
| **H. YAGNI-gated** | **Phase 3** (only if running/planning DPAs) · **Phase 8** (only items with a concrete current need) | Defer until there's a real campaign driver. Building these speculatively violates YAGNI (see §D). | M |

### What NOT to do

- **Don't skip Stage A (Quick Wins).** They're ~30 minutes and account for a disproportionate share of the EMQ lift.
- **Don't do Phase 4 before Phase 0.** The `onAfterHandle` hook reads `fbclid` from the Referer; without Phase 0's `referrerPolicy: 'no-referrer-when-downgrade'`, Next.js's default `strict-origin-when-cross-origin` strips the query string and the hook sees nothing.
- **Don't do Phase 1 before Phase 0.** Persisting context at checkout time requires `extractCapiContext` to exist first.
- **Don't ship F1 (`credentials: true`) without F15 (origin allowlist).** Wide-open `origin: true` + credentials is a CSRF surface. Bundle them in one PR.
- **Don't build Phase 8 speculatively.** Consent gating, multi-currency, server ViewContent — only when there's a concrete requirement (see §D YAGNI table).
- **Don't treat Phase 9 as "last".** Run its checks incrementally after each stage; a regression caught early is ~10× cheaper to fix.
- **Don't do Phase 3 unless you have/plan Dynamic Product Ads.** It's M-complexity work (signature ripple) with zero EMQ impact if no campaign consumes the catalog correlation.

### Parallelization opportunities (if multiple engineers)

- After Stage B (Phase 0) lands, **Stage C (Phase 1)** and **Stage D (Phase 4)** can proceed in parallel — they touch `payment/service.ts` (persistence/rehydration) and `backend/src/index.ts` (the hook) respectively, with no file overlap.
- **Stage F (Phase 6 + 7)** is client-side + backend cleanup and can run anytime after Stage A; pairs well with anything.

---

## D. Engineering Principles (DRY & YAGNI)

Every task in this plan must satisfy these two principles. When a phase tempts you to violate one, stop and reconsider.

### DRY (Don't Repeat Yourself)

**Rule:** every cross-boundary repeated concept must have exactly one source of truth. Duplication drifts; drift breaks Meta matching **silently** (the worst failure mode — no error, just lower EMQ).

| Concept | Single source of truth | Shared via |
|---|---|---|
| `normalizePhone` (UAE → E.164) | One function | `packages/shared-utils` — imported on BOTH client + server. F6 exists *because* this was duplicated by copy-paste and the client copy was lost. Fix it properly, not by mirroring again. |
| `normalizeCity` / `normalizeCountry` / `normalizeName` / `normalizeEmail` | One function each | `packages/shared-utils` |
| `toContentId(variant)` → `cap-${sku \|\| id}` | One function | `packages/shared-utils` (Phase 3) |
| `extractCapiContext(request)` | One function | `apps/backend/src/lib/meta-capi.ts` — the 9 `sendMetaEvent` call sites must NOT re-parse `request.headers` themselves after the helper exists. |
| `capiMetadataFields(ctx)` / `capiContextFromRecord(rec)` / `capiContextFromOrder(order)` | One module | `apps/backend/src/lib/meta-capi.ts` |
| `currency` ("AED") | One named `const CURRENCY` | imported everywhere; no literal `"AED"` scattered across the codebase. |
| `purchase_<orderId>` event_id pattern | One `purchaseEventId(orderId)` helper | used by every server path; documented for the client. |

**Concrete DRY tasks to fold into the phases:**
- [ ] **Phase 0:** before refactoring the 9 call sites, extract `extractCapiContext` once. After it exists, grep for `headers.get("x-fbp")` / `headers.get("x-fbc")` — every direct read must be gone.
- [ ] **Phase 2:** move `normalizePhone` to `packages/shared-utils` (create the package if it doesn't exist); import on both sides. Delete the duplicate. Add a CI grep test that fails if the two copies ever diverge.
- [ ] **Phase 3:** `toContentId` lives in `packages/shared-utils`, not duplicated in client + server.
- [ ] **All phases:** grep for the literals `"AED"` / `"ae"` / `"v21.0"` / `"v23.0"` — each must appear exactly once (as a named constant) and be imported everywhere else.

**When DRY is genuinely impossible (and the disciplined workaround):**
Client bundle vs server bundle can't share runtime code unless a shared package exists. If creating `packages/shared-utils` is truly out of scope for the current milestone, copy the function **with a header comment**:
```ts
// MIRROR OF apps/backend/src/lib/meta-capi.ts:23-31 — keep in sync.
// CI test: tests/meta-parity.test.ts enforces byte-equality.
```
…and add a CI test that compares the two strings and fails on drift. This is a **documented, tested** exception — never silent duplication.

### YAGNI (You Aren't Gonna Need It)

**Rule:** build only what the integration guide + active campaigns require. Every speculative abstraction is a maintenance liability and a privacy/PII surface.

| Tempting build | Build it now? | Reason |
|---|---|---|
| Consent gating (F17) | **No** — UAE-only today | No GDPR exposure. Scaffold only when multi-country expansion is a *committed* roadmap item, not a hypothetical. |
| Server-side `trackViewContent` | **No** — unless a campaign optimizes on it | Browser ViewContent already fires; CAPI ViewContent only matters for optimization objectives that consume it. |
| Multi-currency support | **No** — store is AED-only | Make `currency` an explicit param at the boundary (cheap, do in Phase 8), but don't build a converter. |
| Multi-country `normalizePhoneForCountry(code, phone)` | **No** — UAE-only | Current normalizer covers 100% of real traffic. |
| `data_processing_options` / LDU mode | **No** — no US-state traffic | Revisit only if NA expansion ships. |
| Dedup monitoring dashboard | **No** — unless dedup health is being actively diagnosed | A `console.log(eventId+eventName+source)` in `sendMetaEvent` is enough; don't build a metrics pipeline. |
| Generic `PaymentProvider` abstraction | **No** — only Ziina/Tabby/Tamara/COD exist | Add the abstraction when a 4th provider with meaningfully different flow is onboarded. |
| `Order.capiContext` JSON column | **Yes** (Phase 1) | Required to fix the current Purchase EMQ cliff — a real, present problem. |
| `capi-headers.ts` helper | **Yes** (Phase 0) | Required for cross-origin identity — a real, present problem. |
| CORS origin allowlist regex | **Yes** (Phase 0) | Required security once `credentials: true` ships. |

**The YAGNI test for any task:** *"Does the integration guide require this, OR is there an active campaign/optimization objective that needs it?"* If neither, defer. Add it to section H (Out-of-scope / Future) with the **trigger condition** that would resurrect it.

**Anti-patterns to refuse during implementation:**
- Building a generic "analytics event bus" when only Meta consumes the events.
- Abstracting PSP flows behind interfaces for hypothetical future providers.
- Adding optional fields to the Order schema "in case we need them".
- Creating an `/admin/meta-health` dashboard before Events Manager proves insufficient.
- Pre-building `data_processing_options` state machinery before any US launch.

---

## E. Phased Remediation Plan

Phases are ordered by EMQ leverage (highest first). Each phase is independently shippable and verifiable.

### Phase 0 — Cross-origin identity backbone

**Goal:** Make `_fbp` / `_fbc` (and `_fbc`'s ad-click attribution) reliably reach the backend on every cross-origin API call.

**Why it matters:** This is the guide's "single highest-value fix" (§5). Without it, every CAPI event is missing the primary browser↔server identity link Meta uses to confirm Pixel+CAPI describe the same session. Direct EMQ lift on every server event; required prerequisite for Phase 4 (fbclid→`_fbc` hook, which depends on `referrerPolicy` preserving the query string).

**Concrete tasks** (tie to F1, F2, F3, F15):
- [ ] **F1 + F15 — Fix CORS to allow credentials with a reflected allowlist.** At `apps/backend/src/index.ts:40-47`, replace `origin: true, credentials: false` with the guide §6 pattern: a function-based origin that returns `true` for the production domain family (`capellauae.com` + subdomains, dashboard, localhost) and `false` otherwise, plus `credentials: true`. Add `allowedHeaders` to include `x-fbp`, `x-fbc`, `x-fb-event-id` (in addition to existing `Content-Type`, `Authorization`, `x-session-id`). Without the allowlist, `credentials: true` would echo any origin — a CSRF surface.
- [ ] **F2 — Add `credentials` + `referrerPolicy` to the centralized client.** At `apps/marketing/src/lib/api-client.ts:46-49`, hard-code `credentials: 'include'` and `referrerPolicy: 'no-referrer-when-downgrade'` into `fetchOptions`. This is the lever — every `apiGet/apiPost/apiPut/apiPatch/apiDelete` call inherits it.
- [ ] **F2 — Patch the two stragglers that bypass `apiClient`.** Add the same two options to the raw `fetch` in `apps/marketing/src/lib/analytics.ts:46-55` and `apps/marketing/src/app/[locale]/contact/hooks/use-contact-form.ts:33-37`.
- [ ] **F3 — Create `apps/marketing/src/lib/capi-headers.ts`** (the guide §5 helper). Reads `_fbp` and `_fbc` from `document.cookie` and returns `{ 'x-fbp': …, 'x-fbc': … }` (SSR-safe: returns `{}` when `typeof document === 'undefined'`). Mirror the guide's `capiHeaders()` exactly.
- [ ] **F3 — Spread `capiHeaders()` into `apiClient` defaults.** At `apps/marketing/src/lib/api-client.ts:37-40`, merge `...capiHeaders()` into `requestHeaders` so every API call auto-forwards fbp/fbc as headers — not just the call sites that remember to put them in the body.
- [ ] **F3 — Backend: read header-first, cookie-fallback.** Already true in spirit (fbp/fbc are read from `body.fbp`/`body.fbc` in handlers). Add a small helper `extractCapiContext(request)` in `meta-capi.ts` (guide §8.7 pattern) that reads `x-fbp`/`x-fbc`/`x-forwarded-for`/`x-real-ip`/`user-agent`/`referer`/`x-fb-event-id` in one place; refactor the 9 `sendMetaEvent` call sites to use it. Keep body-based `body.fbp`/`body.fbc` as a fallback so the migration is non-breaking.
- [ ] **Verify CORS allowlist regex covers PR previews.** The actual production domain is `capellauae.com` (not the guide's `nabdalqalam.com`). Update the regex in the new origin function to `^https:\/\/[a-zA-Z0-9-]+\.capellauae\.com$`.

**Acceptance / verification:**
- Code: grep `apps/marketing/src` for `fetch(` to the API host and confirm every match has `credentials` and `referrerPolicy` (either directly or via `apiClient`).
- Browser DevTools: on a PDP → AddToCart, the request to `/api/analytics/track/cart-add` shows request headers `x-fbp`, `x-fbc`, and `Cookie: _fbp=…; _fbc=…` (cookie flow now works).
- Events Manager → Test Events (server): the AddToCart payload's `user_data` includes `fbp` and `fbc` populated from the header.
- Complexity: **M.**

---

### Phase 1 — Webhook context round-trip (Purchase-EMQ cliff)

**Goal:** Persist the full browser context (IP, UA, real `event_source_url`, fbp, fbc) at checkout creation; rehydrate it on every webhook Purchase path.

**Why it matters:** The #1 cause of "Purchase EMQ < InitiateCheckout EMQ" (guide §10). InitiateCheckout fires from a browser-sourced request and has IP/UA/fbp/fbc; the Ziina/Tabby/Tamara webhook fires from the PSP's servers and currently has only fbp/fbc. Meta weights `client_ip_address + client_user_agent` as a medium EMQ signal, and `action_source: "website"` formally expects them. Also: today `event_source_url` is hardcoded — the actual PDP/checkout URL the user came from is lost.

**Concrete tasks** (tie to F4):
- [ ] **F4 — Add a `capiContext` JSON column to the Order table.** Prisma migration: `model Order { capiContext Json? }`. Mirrors guide §10's `Order.capiContext`. (Check first whether this column already exists — the prior architecture doc suggests it might not.)
- [ ] **F4 — Persist the full context at checkout creation.** In `PaymentService.prepareOrder` (`apps/backend/src/modules/payment/service.ts:51-166`), accept an additional `capiCtx` parameter; write `{ fbp, fbc, clientIpAddress, clientUserAgent, eventSourceUrl }` into `order.capiContext` alongside the existing `fbp`/`fbc` columns (lines 144-145). Build a tiny `capiMetadataFields(capiCtx)` helper (guide §10 pattern).
- [ ] **F4 — Thread `extractCapiContext(request)` into `createCheckoutSession`.** At `apps/backend/src/modules/payment/index.ts:39-52`, capture the context from the browser-sourced `/payments/checkout` request and pass it through `PaymentService.createCheckoutSession(body, userId, origin, capiCtx)`. (Will be natural after Phase 0 lands the `extractCapiContext` helper.)
- [ ] **F4 — Rehydrate at webhook time.** In `PaymentService.markOrderPaid` (`service.ts:173-288`), replace the bare `fbp: order.fbp, fbc: order.fbc` (lines 282-283) with `capiContextFromOrder(order)` (persisted-first) — fall back to the bare columns only if the JSON is absent. Set `eventSourceUrl` from `order.capiContext.eventSourceUrl` instead of the hardcoded `${MARKETING_URL}/checkout` (line 284). Add the `capiContextFromOrder` / `capiContextFromRecord` helpers to `meta-capi.ts` (guide §10 pattern).
- [ ] **F4 — Apply the same pattern to the COD path.** `OrderService.create` (`order/service.ts:88-289`) already has the live browser context — keep using `body.fbp`/`body.fbc` directly (lines 283-284), but also set the real `eventSourceUrl` from the request Referer (`request.headers.get('referer')`) instead of the hardcoded `${MARKETING_URL}/checkout` (line 285). Pass through the live IP/UA.
- [ ] **F4 — Don't forget the 3 PSPs.** Ziina (`handleWebhook`, line 408), Tabby (`handleTabbyWebhook`, line 655), Tamara (`handleTamaraWebhook`, line 919) all funnel through `markOrderPaid` — the single rehydration point covers all three. ✓

**Acceptance / verification:**
- Code: `Order.capiContext` populated on a fresh Ziina/Tabby/Tamara checkout POST.
- Events Manager → Test Events → server Purchase payload includes `client_ip_address`, `client_user_agent`, `event_source_url` (real page URL, not just `…/checkout`), `fbp`, `fbc`, plus the usual `em`/`ph`/`fn`/`ln`/`ct`/`country`/`external_id`.
- Events Manager over 2 weeks: Purchase EMQ climbs to ≥ InitiateCheckout EMQ (funnel monotonicity restored).
- Complexity: **M.**

---

### Phase 2 — Data-quality: country code, client `ph`, name split

**Goal:** Stop sending fields Meta silently drops; close the client/server `ph` divergence.

**Why it matters:** Two silent EMQ killers — every Purchase has a worthless `country` (F5), and every browser event for a logged-in user has a worthless `ph` because the client doesn't normalize (F6). Both are 5-line fixes with disproportionate impact.

**Concrete tasks** (tie to F5, F6, F19):
- [ ] **F5 — Send ISO alpha-2 country.** At `apps/marketing/src/app/[locale]/checkout/constants.ts:15`, change `DEFAULT_COUNTRY = "United Arab Emirates"` to `DEFAULT_COUNTRY = "AE"`. (Alternatively, normalize in `meta-capi.ts:normalizeCountry` by mapping common full names to ISO-2, but the cleaner fix is at the source.) Verify no other code path passes a full country name (e.g. saved-address flow in `use-saved-addresses.ts:43`).
- [ ] **F6 — Add `normalizePhone` to the client.** Create a client-side `normalizePhone` in `apps/marketing/src/lib/facebook-pixel.ts` that **byte-for-byte mirrors** `apps/backend/src/lib/meta-capi.ts:23-31` (UAE-aware: strip non-digits → `00` → `971` → leading `0` → 9-digit bare → passthrough). Apply it in `setPixelUser` before assigning `advancedMatching.ph = normalizePhone(user.phone)` (`facebook-pixel.ts:50`). **Critical:** any divergence = silent `ph` mismatch.
- [ ] **F6 — Also normalize `em` implicitly.** The Pixel SDK already lowercases/trimmes `em` internally, but pass `user.email.trim().toLowerCase()` defensively in `setPixelUser` (`facebook-pixel.ts:49`).
- [ ] **F6 — Mirror on the contact form.** The Lead path passes `body.name.split(" ")[0]` and `.slice(1).join(" ")` for fn/ln (`contact/index.ts:27-28`) — fine. But the form should also normalize the phone if/when it ever sends one to the pixel (currently `fbLead` doesn't pass phone). No-op for now.
- [ ] **F19 — Fix `external_id` hashing.** At `apps/backend/src/lib/meta-capi.ts:124`, replace `sha256(normalizeEmail(externalId))` with `sha256(externalId.trim())`. UUIDs are unaffected but the semantics are correct.

**Acceptance / verification:**
- Code: grep `DEFAULT_COUNTRY` — value is `"AE"`.
- Code: `setPixelUser` calls `normalizePhone` before assigning `ph`.
- Events Manager → Test Events → browser Purchase: `ph` (hashed) on the browser event matches the `ph` on the server event for the same user.
- Events Manager → server Purchase sample payload: `country` is the hash of `"ae"`, not `"unitedarabemirates"`.
- Complexity: **S.**

---

### Phase 3 — Catalog content_id parity (DPA unlock)

**Goal:** Make Pixel + CAPI `content_ids` byte-for-byte match the Meta Commerce catalog feed.

**Why it matters:** Until this lands, Meta cannot correlate conversion events with the product catalog → Dynamic Product Ads retargeting, catalog-level ROAS reporting, and content-based EMQ inputs are all broken. F8. Not a direct EMQ-killer but a scaling/targeting ceiling.

**Concrete tasks** (tie to F8):
- [ ] **F8 — Pick the canonical content_id scheme.** Either (a) change the catalog feed to emit `variant.id` as the `id` column (`apps/backend/src/modules/meta-catalog/service.ts:158-159`), or (b) change every event to emit `cap-${variant.sku || variant.id}`. Option (b) is recommended because the `cap-` prefix is already a stable, brand-scoped identifier and the feed already uses it. Document the choice in the codebase.
- [ ] **F8 — Add a shared `toContentId` helper.** Either in `packages/shared-utils` (so both client and server import it) or duplicated in `apps/marketing/src/lib/content-id.ts` and `apps/backend/src/lib/meta-capi.ts`. Signature: `toContentId(variant: { sku: string | null; id: string }): string` returning `cap-${variant.sku || variant.id}`.
- [ ] **F8 — Apply on the client.** Update every call site in `apps/marketing/src/lib/analytics.ts` (lines 141, 148, 228, 268) and `apps/marketing/src/lib/facebook-pixel.ts` (the `contentId` params) to map raw `variantId` → `cap-${sku || variantId}`. This requires the caller to pass `sku` alongside `variantId` — extend `CheckoutItem` / `trackQuickAddToCart` / `fbAddToCart` signatures.
- [ ] **F8 — Apply on the server.** Update `analytics/index.ts` (lines 171, 223, 349) to use the helper on `body.contentIds`. Since the client now sends pre-formatted ids, this may be a pass-through — but be explicit so a future drift is impossible.
- [ ] **F8 — Re-upload the catalog feed** in Commerce Manager after the change so Meta's side matches.

**Acceptance / verification:**
- Events Manager → Test Events → any AddToCart: `content_ids[0]` equals the catalog feed `id` column for that variant.
- Commerce Manager → Catalog → "Events received for these items" shows the variants receiving events (was empty before).
- Complexity: **M** (signature changes ripple through call sites).

---

### Phase 4 — ITP / ad-blocker / iOS-14 resilience (`_fbc` capture)

**Goal:** Reconstruct `_fbc` server-side from the `fbclid` query param so ad-click attribution survives ad blockers and the 7-day ITP JS-cookie cap.

**Why it matters:** Without this, every deferred Purchase (3+ days after the ad click, or any conversion under an ad blocker) loses `_fbc` → Meta cannot tie the conversion to the ad click → optimization degrades, CPA climbs, lookalikes weaken. Guide §7. **Depends on Phase 0** (the `referrerPolicy: 'no-referrer-when-downgrade'` change is what keeps `?fbclid=…` in the Referer so the hook can read it).

**Concrete tasks** (tie to F9):
- [ ] **F9 — Add the `onAfterHandle` hook in `apps/backend/src/index.ts`.** After the CORS `.use(...)` block (around line 47), register the guide §7 hook verbatim: parse `fbclid` from `request.headers.get('referer')`; if present and no `_fbc` cookie exists on the request, set `Set-Cookie: _fbc=fb.1.<unix_ms>.<fbclid>; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=7776000` (90 days).
- [ ] **F9 — Add `fbcFromFbclid` referer fallback in `meta-capi.ts`.** Pure function: given a Referer URL, extract `fbclid` and synthesize `fb.1.<unix_ms>.<fbclid>` if no canonical `_fbc` is present. Used by the new `extractCapiContext` helper from Phase 0.
- [ ] **F9 — Read order in `extractCapiContext`.** `fbc = headers['x-fbc'] || cookie['_fbc'] || fbcFromFbclid(referer) || undefined`. Guide §7.
- [ ] **F9 — Verify HTTPS-only.** The hook sets `Secure`, so it only writes on HTTPS. Confirm staging/prod terminate TLS before the backend (or at the edge).

**Acceptance / verification:**
- Browser DevTools: land on the storefront with `?fbclid=abc123`; the next API request's response includes `Set-Cookie: _fbc=fb.1.…abc123`.
- Subsequent API requests include `Cookie: _fbc=…` (cookie replay) **and** `x-fbc: …` (header forward from Phase 0).
- Events Manager → server event payload includes `fbc` populated for an ad-click-originating session, even with the browser Pixel blocked (test with uBlock Origin).
- Complexity: **S** (assuming Phase 0 landed).

---

### Phase 5 — `event_source_url` coverage

**Goal:** Set `event_source_url` to the real page URL on every CAPI event.

**Why it matters:** Minor but free EMQ lift. Today 6 of 9 `sendMetaEvent` call sites omit it, and the 3 that set it hardcode `${MARKETING_URL}/checkout`. F10.

**Concrete tasks** (tie to F10):
- [ ] **F10 — `extractCapiContext` reads Referer.** Phase 0's helper already captures `referer || origin` into `eventSourceUrl` (guide §8.7). Confirm.
- [ ] **F10 — Thread it through every call site.** Update `analytics/index.ts` (AddToCart 164, RemoveFromCart 217, InitiateCheckout 342), `contact/index.ts` (Lead 23), `auth/index.ts` (CompleteRegistration 27, Login 67) to pass `eventSourceUrl: capiCtx.eventSourceUrl`. COD/webhook Purchase (`order/service.ts:285`, `payment/service.ts:284`) replace the hardcoded URL with the persisted/live `eventSourceUrl` (the Phase 1 rehydration covers webhooks).
- [ ] **F10 — Persist on the Order for webhooks.** Phase 1's `capiContext.eventSourceUrl` already covers this.

**Acceptance / verification:**
- Events Manager → server event sample payload: `event_source_url` is the actual PDP/checkout/contact URL, including locale prefix.
- Complexity: **S.**

---

### Phase 6 — Browser Pixel hygiene

**Goal:** Bring the loader component up to the guide's §4 standard.

**Why it matters:** Hardens the browser channel — the only channel that works when CAPI is unavailable. F11, F12.

**Concrete tasks** (tie to F11, F12):
- [ ] **F11 — Add the initial PageView to the snippet.** At `apps/marketing/src/components/analytics/facebook-pixel.tsx:14-31`, append `fbq('track', 'PageView');` after `fbq('init', …)`. (Currently relies solely on the SPA tracker, which is fine for SPA nav but should also fire on hard load per the canonical pattern.)
- [ ] **F12 — Keep `autoConfig: 'false'`** (it is the safer choice given manual AM is wired), **but** document the rationale in a comment. The fix here is F6 (Phase 2) — once client `ph` is normalized, manual AM is strictly better than AAM. No code change in this phase beyond the comment.
- [ ] **Verify the empty-ID guard.** `if (!FB_PIXEL_ID) return null;` is present (`facebook-pixel.tsx:8-10`). ✓ matches guide §4.3. No change.
- [ ] **Verify the `noscript` fallback.** Present (`facebook-pixel.tsx:32-40`). ✓ matches guide §4.3.5. No change.

**Acceptance / verification:**
- Browser DevTools Network tab on hard load: a `tr?id=…&ev=PageView` request fires (was previously only firing on SPA nav).
- Complexity: **S.**

---

### Phase 7 — Resilience, hygiene, and cleanup

**Goal:** Trim wasted CAPI budget, future-proof the Graph version, fix the `external_id` semantics, and tighten the boot warning.

**Why it matters:** F14 (Login waste), F16 (Graph version), F19 (external_id). None are EMQ-breaking; all are good hygiene that compounds.

**Concrete tasks** (tie to F14, F16, F19):
- [ ] **F14 — Drop the Login CAPI call.** At `apps/backend/src/modules/auth/index.ts:49-88`, remove the `sendMetaEvent({ eventName: "Login", … })` block (lines 59-78). "Login" is not a Meta standard event and cannot drive optimization; the PII egress is pure cost. Replace with the existing internal `trackAuthLogin` (referenced in the prior review at `analytics/service.ts:438`) if not already wired. If retained for audience purposes, document explicitly that it is audience-only.
- [ ] **F16 — Bump Graph API version.** At `apps/backend/src/lib/meta-capi.ts:6`, change default `"v21.0"` → `"v23.0"`. Keep the `META_API_VERSION || …` env override. Test in Events Manager after switching.
- [ ] **F19 — Fix `external_id` hashing.** (Already in Phase 2 task list — track here if not done there.)
- [ ] **Add a boot-time test-event-code warning** at `apps/backend/src/index.ts` startup (guide §14 pattern). The current per-call warning (`meta-capi.ts:105-109`) is good; add a one-shot boot log so it surfaces even if no event fires.

**Acceptance / verification:**
- Events Manager event list: no more `Login` custom events firing after sign-in.
- CAPI logs: Graph URL contains `v23.0`.
- Complexity: **S.**

---

### Phase 8 — Enhancements & future-proofing

**Goal:** Scaffold for multi-country, consent regions, and richer matching keys — without breaking the current UAE-only flow.

**Why it matters:** F17, F18. Not needed today but flagged in guide §17 as porting concerns.

**Concrete tasks** (tie to F17, F18, plus optional enhancements):
- [ ] **F17 — Consent gating scaffold.** Add a `consentedToMarketing` flag to the auth/contact/order payloads (default `true` for UAE); in `sendMetaEvent`, omit `em`/`ph`/`fn`/`ln`/`ct`/`external_id` when false (keep IP/UA/fbp/fbc). Do not gate the Pixel loader yet — wire the flag end-to-end first.
- [ ] **F18 — Make `currency` explicit.** At each value-bearing event wrapper in `facebook-pixel.ts` and the `sendMetaEvent` signature, make `currency` a required parameter (drop the `|| "AED"` default at the boundary). Internal default stays for non-value events.
- [ ] **Optional — `trackViewContent` server-side.** The catalog has no CAPI ViewContent today. If any campaign optimizes on ViewContent, add a thin `trackViewContent` wrapper (guide §17 porting note). Low priority.
- [ ] **Optional — Deduplication monitoring.** Add a log line in `sendMetaEvent` recording `eventId + eventName + source` so dedup-health can be observed over time.

**Acceptance / verification:**
- Phase-gated behind a feature flag; no behavior change in production until explicitly enabled.
- Complexity: **M** (consent scaffold touches many surfaces).

---

### Phase 9 — Verification & rollout

**Goal:** Validate end-to-end in Events Manager before/after each phase ships.

**Tasks:**
- [ ] **Pre-deploy: Test Events validation.** For each event (PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase [COD], Purchase [Ziina], Purchase [Tabby], Purchase [Tamara], Lead, CompleteRegistration), confirm exactly one deduplicated event per `event_id`, with `Connection Method` showing both Browser + Server where applicable.
- [ ] **Post-Phase-0: Browser + Server counts.** For AddToCart/InitiateCheckout/Purchase, the Browser + Server counts sum to ~the dedup'd total; "Deduplicated" ratio > 80%.
- [ ] **Post-Phase-1: Funnel monotonicity.** EMQ is non-decreasing: ViewContent ≤ AddToCart ≤ InitiateCheckout ≤ Purchase. If Purchase < InitiateCheckout, re-check the webhook context round-trip.
- [ ] **Post-Phase-2: Sample payload audit.** Open a Purchase server event in Events Manager and confirm `em`, `ph`, `fn`, `ln`, `ct`, `country` (=`ae`), `external_id`, `fbp`, `fbc`, `client_ip_address`, `client_user_agent`, `event_source_url` are all populated.
- [ ] **Post-Phase-4: Ad-blocker test.** Repeat the Purchase flow with uBlock Origin enabled; confirm the server Purchase still carries `fbc` synthesized from the Referer's `fbclid`.
- [ ] **Post-Phase-7: Login removal.** Confirm no new `Login` events appear after sign-in.
- [ ] **Dashboard sanity.** ROAS / CPA reports stable or improving in the 7 days after each phase; no sudden drops (a drop to ~0 suggests `FB_CAPI_TEST_EVENT_CODE` leaked into prod).

---

## F. Quick Wins (Stage A — do these first, ~30 min, outsized EMQ impact)

1. **Fix `DEFAULT_COUNTRY`**: `apps/marketing/src/app/[locale]/checkout/constants.ts:15` — change `"United Arab Emirates"` → `"AE"`. Stops every Purchase `country` from being silently dropped by Meta. (F5)
2. **Flip CORS credentials + add `credentials`/`referrerPolicy` to `apiClient`**: `apps/backend/src/index.ts:43` (`credentials: true` + allowlist), `apps/marketing/src/lib/api-client.ts:46-49` (add the two options). Unblocks cookie/header identity flow on every API call in one shot. (F1, F2)
3. **Add `normalizePhone` to the client and call it in `setPixelUser`**: `apps/marketing/src/lib/facebook-pixel.ts:50`. Mirrors `meta-capi.ts:23-31`. Stops logged-in-user `ph` from mismatching between browser and server. (F6)

---

## G. Risk Register

| Risk | Mitigation |
|---|---|
| **F1 + F15 ordering hazard.** If `credentials: true` ships without the origin allowlist (or vice versa), the deployment either (a) breaks auth (cookies not sent because `credentials: false`) or (b) opens a CSRF surface (any origin reflected with credentials). Ship both in the same PR. | Phase 0 bundles F1 + F15 + F2 as one atomic change. |
| **`referrerPolicy` change leaks PII in Referer.** `no-referrer-when-downgrade` sends the full URL (incl. query) on HTTPS→HTTPS cross-origin requests. If any URL in the app carries sensitive data in the query string, it will now reach the backend's logs. | Audit backend logging (`requestLogger`) for Referer logging; redact query strings if needed before shipping Phase 0. |
| **Phase 3 (content_id change) desyncs the catalog temporarily.** If the client/server update ships before the catalog feed re-upload, Meta sees mismatched ids and DPA performance degrades further for the gap window. | Coordinate the code change with a manual catalog feed re-upload in Commerce Manager; ship in the same change window. |
| **`Order.capiContext` migration risk.** Adding a JSON column is low-risk, but verify the production Prisma migration path and back-fill null for existing rows. | Phase 1 includes a migration step; test on staging first. |
| **Stripe-style metadata field-size caps don't apply here** (the guide's 500-char UA slice was for Stripe; Ziina/Tabby/Tamara don't impose the same cap), but if any PSP metadata is used in future, re-check. | Document in Phase 1 that the Order JSON column has no such cap. |
| **Privacy / consent for non-UAE expansion.** UAE-PDPL today is permissive; if the store ever serves EU traffic, the unconditional Pixel load + CAPI PII becomes a GDPR/ePrivacy violation. | Phase 8 scaffolds the consent flag; do not enable multi-country without completing it. |
| **Test-event-code leak to prod.** The current `meta-capi.ts:104-109` guard ignores the code in prod, but the boot-time warning (Phase 7) is the second layer. A third layer (refuse to boot if `IS_PROD && TEST_EVENT_CODE`) is optional. | Phase 7 adds the boot warning; consider the hard-fail guard if the team has had close calls. |
| **Removing the Login CAPI event** may break a Meta audience that depends on it. | Before Phase 7, check Audiences in Events Manager for any audience built on `Login`; migrate to a hashed-email Custom Audience upload first. |

---

## H. Out-of-scope / Future (guide §17 porting notes that don't apply now)

- **Multi-country `normalizePhone`.** The current UAE-aware normalizer (`meta-capi.ts:23-31`) hardcodes `971`. For a future multi-country expansion, derive the country code from the shipping address / locale and share the **exact same logic on client and server** (Phase 2 task mirrors the UAE version; a multi-country version needs a parallel `normalizePhoneForCountry(code, phone)`).
- **`book_<id>` / `collection_<id>` / `game_<id>` content_id scheme.** Guide §17.3 — does not apply; this is a jewelry store with a single product type. The actual scheme is `cap-${sku || variantId}` (Phase 3).
- **Stripe metadata round-trip.** Guide §10's `capiMetadataFields` / `capiContextFromStripeMetadata` are Stripe-specific. The actual PSPs (Ziina/Tabby/Tamara) don't expose Stripe-style session metadata, so the equivalent persistence goes into `Order.capiContext` (Phase 1). No Stripe migration needed.
- **Consent gating for non-UAE.** Guide §17.7 — scaffolded in Phase 8 but not enabled.
- **`data_processing_options` / LDU for US-state users.** Not relevant for a UAE-only store; revisit if NA expansion happens.
- **`trackViewContent` server-side.** Guide §17.6 — `ViewContent` is browser-only today; add only if a campaign optimizes on it.

---

*End of plan. Phases are numbered by EMQ leverage, **not** by implementation order — see §C for the recommended stage sequence. Each phase is independently shippable and verifiable.*
