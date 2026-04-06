# Tasks: Jewellery E-commerce Transformation

**Feature Branch**: `001-jewellery-ecommerce-transform`
**Date**: 2026-04-06

## Phase 1: Setup — Shared Packages & Schema

- [ ] T001 Add `ProductBadge` enum and `badge`, `isTrending`, `materialId`, `stoneId`, `clarityId` fields to `packages/shared-types/src/product.ts`
- [ ] T002 [P] Create `packages/shared-types/src/payment.ts` with `PaymentSession` interface
- [ ] T003 [P] Create `packages/shared-types/src/search.ts` with `SearchEvent`, `TrendingProduct` interfaces
- [ ] T004 Update `packages/shared-types/src/index.ts` to re-export new modules
- [ ] T005 Add `PRODUCT_BADGES` and `PAYMENT_METHODS` constants to `packages/shared-utils/src/constants.ts`
- [ ] T006 Run `pnpm install stripe` in `apps/backend/`
- [ ] T007 Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MARKETING_URL` to `apps/backend/.env.example`

---

## Phase 2: Database Schema Changes

- [ ] T008 Add `ProductBadge` enum to `apps/backend/prisma/schema/product.prisma`
- [ ] T009 Add `badge`, `isTrending`, `materialId`, `stoneId`, `clarityId` fields to `Product` model in `apps/backend/prisma/schema/product.prisma`
- [ ] T010 Add `Material`, `Stone`, `Clarity` models to `apps/backend/prisma/schema/attribute.prisma` (copy `Color` model pattern)
- [ ] T011 Add `bannerTitleEn/Ar`, `bannerDescriptionEn/Ar`, `bannerCtaTextEn/Ar` fields to `Collection` model in `apps/backend/prisma/schema/collection.prisma`
- [ ] T012 Add `CollectionBanner` model to `apps/backend/prisma/schema/collection.prisma`
- [ ] T013 Add `paymentMethod`, `stripeSessionId` (unique), `paidAt` fields to `Order` model in `apps/backend/prisma/schema/order.prisma`
- [ ] T014 Run `pnpm db:generate && pnpm db:migrate` from repo root

---

## Phase 3: Backend — Attribute Modules (Material, Stone, Clarity)

Follow the existing `apps/backend/src/modules/color/` pattern (index.ts, service.ts, model.ts).

- [ ] T015 [P] Create `apps/backend/src/modules/material/index.ts` with CRUD routes (copy `color/index.ts`, replace Color→Material)
- [ ] T016 [P] Create `apps/backend/src/modules/material/service.ts` with static methods (copy `color/service.ts`)
- [ ] T017 [P] Create `apps/backend/src/modules/material/model.ts` with validation schemas (copy `color/model.ts`)
- [ ] T018 [P] Create `apps/backend/src/modules/stone/index.ts` (copy Material module, replace Material→Stone)
- [ ] T019 [P] Create `apps/backend/src/modules/stone/service.ts`
- [ ] T020 [P] Create `apps/backend/src/modules/stone/model.ts`
- [ ] T021 [P] Create `apps/backend/src/modules/clarity/index.ts` (copy Material module, replace Material→Clarity)
- [ ] T022 [P] Create `apps/backend/src/modules/clarity/service.ts`
- [ ] T023 [P] Create `apps/backend/src/modules/clarity/model.ts`
- [ ] T024 Register `material`, `stone`, `clarity` modules in `apps/backend/src/index.ts`

---

## Phase 4: Backend — Product & Collection Updates

- [ ] T025 Update `apps/backend/src/modules/product/model.ts` to add `badge`, `isTrending`, `materialId`, `stoneId`, `clarityId` to create/update schemas
- [ ] T026 Update `apps/backend/src/modules/product/service.ts` to handle new fields in create/update methods
- [ ] T027 Update `apps/backend/src/modules/collection/model.ts` to add banner fields
- [ ] T028 Update `apps/backend/src/modules/collection/service.ts` to handle banner fields and `CollectionBanner` relation

---

## Phase 5: Backend — Payment Module (Stripe)

- [ ] T029 Create `apps/backend/src/modules/payment/model.ts` with `checkoutBody` and `webhookHeaders` schemas
- [ ] T030 Create `apps/backend/src/modules/payment/service.ts` with `createCheckoutSession()` and `handleWebhook()` methods
- [ ] T031 Create `apps/backend/src/modules/payment/index.ts` with `POST /checkout` and `POST /webhook` routes
- [ ] T032 Register `payment` module in `apps/backend/src/index.ts`

**Implementation Notes for Payment Module:**
- `createCheckoutSession()`: Validate stock, create order (PENDING), call `stripe.checkout.sessions.create()`, return `{ sessionId, url }`
- `handleWebhook()`: Verify signature with `stripe.webhooks.constructEvent()`, handle `checkout.session.completed` and `checkout.session.expired` events
- Idempotency: Skip if `stripeSessionId` already exists on a PAID/CANCELLED order
- Stock re-validation: At webhook, check stock; if out of stock, refund via Stripe and set order to REFUNDED

---

## Phase 6: Backend — Search Enhancement

- [ ] T033 Create `apps/backend/src/modules/search/model.ts` with query validation schemas
- [ ] T034 Create `apps/backend/src/modules/search/service.ts` with `search()`, `getTrending()`, `trackQuery()`, `trackClick()` methods
- [ ] T035 Update `apps/backend/src/modules/search/index.ts` to add new routes: `GET /trending`, `POST /analytics/query`, `POST /analytics/click`
- [ ] T036 Update search query in `service.ts` to also match `sku`, `metaTitleEn/Ar`, `metaDescriptionEn/Ar` fields
- [ ] T037 Update search response to include `badge`, `material`, `stone` from product relations

**Trending Algorithm:**
1. Query `AnalyticsDailyStat` where `type='search.query'`, last 30 days, group by `productId`, order by `count DESC`
2. If fewer than 5 products, supplement with products where `isTrending=true`
3. Return top 8

---

## Phase 7: Backend — Admin Search Analytics

- [ ] T038 Add `GET /api/search/analytics/queries` route to `apps/backend/src/modules/search/index.ts` (admin only)
- [ ] T039 Implement `getAnalytics()` method in `apps/backend/src/modules/search/service.ts` returning `topQueries`, `zeroResultQueries`, `trendingProducts`

---

## Phase 8: Frontend — Design System (US1)

- [ ] T040 Update `apps/marketing/src/app/globals.css` to import serif font (Playfair Display) via `next/font/google` in layout
- [ ] T041 Add CSS custom properties for monochrome palette: `--color-bg: #f4f4f4`, `--color-white: #ffffff`, `--color-black: #000000`
- [ ] T042 Update `apps/marketing/src/app/[locale]/layout.tsx` to load Playfair Display for headings

---

## Phase 9: Frontend — Product Card Enhancement (US1)

- [ ] T043 Update `apps/marketing/src/components/ui/product-card.tsx` to display `badge` prop (NEW/BESTSELLER/LIMITED_EDITION) as a small label
- [ ] T044 Add hover zoom animation to product image using CSS `transform: scale(1.05)` on `group-hover`
- [ ] T045 Add heart/wishlist icon overlay that toggles favourite state (reuse existing `useFavourites` hook)
- [ ] T046 Fix currency display from "LE" to "AED" in `apps/marketing/src/components/ui/product-card.tsx`

---

## Phase 10: Frontend — Search Overlay (US2)

- [ ] T047 Rename `apps/marketing/src/components/layout/global-search.tsx` to `apps/marketing/src/components/layout/search-overlay.tsx`
- [ ] T048 Transform search dropdown into full-width overlay with fade/slide animation (use Framer Motion)
- [ ] T049 Add "Trending Now" section that fetches `GET /api/search/trending` when overlay opens
- [ ] T050 Add "Recent Searches" section reading from `localStorage.getItem('recentSearches')`
- [ ] T051 Update recent searches in localStorage when user submits a query
- [ ] T052 Add predictive search (debounced 300ms) calling `GET /api/search?q=...`
- [ ] T053 Call `POST /api/search/analytics/query` when search executes
- [ ] T054 Call `POST /api/search/analytics/click` when user clicks a search result
- [ ] T055 Update `apps/marketing/src/components/layout/header.tsx` to import renamed `SearchOverlay`

---

## Phase 11: Frontend — Checkout Pages (US3)

- [ ] T056 Create `apps/marketing/src/app/[locale]/checkout/success/page.tsx` — order confirmation page showing order ID and thank you message
- [ ] T057 Create `apps/marketing/src/app/[locale]/checkout/cancel/page.tsx` — payment failed page with retry link to cart

---

## Phase 12: CMS — Product Form Updates (US4)

- [ ] T058 Update `apps/cms/src/pages/products/new.tsx` to add badge dropdown (NEW/BESTSELLER/LIMITED_EDITION/None)
- [ ] T059 Update `apps/cms/src/pages/products/new.tsx` to add trending toggle switch
- [ ] T060 Update `apps/cms/src/pages/products/new.tsx` to add Material, Stone, Clarity dropdowns (fetch from new endpoints)
- [ ] T061 Apply same changes to `apps/cms/src/pages/products/edit.tsx`

---

## Phase 13: CMS — Attribute Pages (US4)

Follow `apps/cms/src/pages/colors.tsx` pattern.

- [ ] T062 [P] Create `apps/cms/src/pages/materials.tsx` — table with CRUD for Material (copy colors.tsx)
- [ ] T063 [P] Create `apps/cms/src/pages/stones.tsx` — table with CRUD for Stone
- [ ] T064 [P] Create `apps/cms/src/pages/clarities.tsx` — table with CRUD for Clarity
- [ ] T065 [P] Create `apps/cms/src/features/materials/` hooks (copy `apps/cms/src/features/colors/` pattern)
- [ ] T066 [P] Create `apps/cms/src/features/stones/` hooks
- [ ] T067 [P] Create `apps/cms/src/features/clarities/` hooks

---

## Phase 14: CMS — Collection Banner (US4)

- [ ] T068 Update `apps/cms/src/pages/collections.tsx` to add banner section with image upload and bilingual text fields

---

## Phase 15: CMS — Search Analytics Dashboard (US5)

- [ ] T069 Update `apps/cms/src/pages/analytics.tsx` to add "Search Analytics" tab
- [ ] T070 Fetch and display top queries, zero-result queries, and trending products from `GET /api/search/analytics/queries`

---

## Phase 16: Translations

- [ ] T071 Add badge translation keys to `apps/marketing/messages/en.json`: `common.badges.new`, `common.badges.bestseller`, `common.badges.limitedEdition`
- [ ] T072 Add same keys to `apps/marketing/messages/ar.json` with Arabic translations
- [ ] T073 Add search overlay keys to both files: `search.trending`, `search.recentSearches`, `search.noResults`
- [ ] T074 Add checkout keys to both files: `checkout.success.title`, `checkout.cancel.title`

---

## Phase 17: RTL Verification

- [ ] T075 Switch Marketing app to Arabic locale and verify all new components render correctly in RTL
- [ ] T076 Verify badge labels, search overlay, and checkout pages display Arabic text correctly

---

## Phase 18: Final Verification

- [ ] T077 Run `pnpm build` from repo root — must succeed with no errors
- [ ] T078 Test Stripe checkout flow: add to cart → checkout → Stripe redirect → success page
- [ ] T079 Test search overlay: open → trending → type query → click result → verify analytics recorded

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | T001-T007 | Setup — shared packages, dependencies |
| 2 | T008-T014 | Database schema changes |
| 3 | T015-T024 | Backend — Material/Stone/Clarity modules |
| 4 | T025-T028 | Backend — Product/Collection updates |
| 5 | T029-T032 | Backend — Payment module (Stripe) |
| 6 | T033-T037 | Backend — Search enhancement |
| 7 | T038-T039 | Backend — Admin analytics |
| 8 | T040-T042 | Frontend — Design system |
| 9 | T043-T046 | Frontend — Product card |
| 10 | T047-T055 | Frontend — Search overlay |
| 11 | T056-T057 | Frontend — Checkout pages |
| 12 | T058-T061 | CMS — Product form |
| 13 | T062-T067 | CMS — Attribute pages |
| 14 | T068 | CMS — Collection banner |
| 15 | T069-T070 | CMS — Analytics dashboard |
| 16 | T071-T074 | Translations |
| 17 | T075-T076 | RTL verification |
| 18 | T077-T079 | Final verification |

**Total Tasks**: 79
**Parallel Opportunities**: T002-T003, T015-T017, T018-T020, T021-T023, T062-T067
