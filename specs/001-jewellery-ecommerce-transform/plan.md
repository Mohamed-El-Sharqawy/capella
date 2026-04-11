# Implementation Plan: Jewellery E-commerce Transformation

**Branch**: `001-jewellery-ecommerce-transform` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-jewellery-ecommerce-transform/spec.md`

## Summary

Transform the Capella monorepo into a premium jewellery e-commerce platform:
extend the product data model with badges, trending flags, and
jewellery-specific attributes (Material, Stone, Clarity); integrate
Stripe-hosted Checkout for AED  payments; rebuild the search overlay as a
premium predictive experience with trending products and analytics; and
apply a luxury design system across the Marketing storefront.

## Technical Context

**Language/Version**: TypeScript 5.x, Bun runtime (backend), Node.js (frontend)
**Primary Dependencies**: ElysiaJS 1.2, Next.js 15, React 19, Prisma 7, Tailwind CSS v4, Shadcn/ui, Stripe, Cloudinary, next-intl
**Storage**: PostgreSQL (Neon) via Prisma 7
**Testing**: Manual verification via Swagger (backend), browser (frontend)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Monorepo — 3 apps (Backend API, Marketing storefront, CMS dashboard) + 2 shared packages
**Performance Goals**: Search overlay < 1s open, predictive results < 500ms, 60fps animations
**Constraints**: AED  currency locked, Stripe standard account only, AR/EN bilingual + RTL, Cloudinary-only media
**Scale/Scope**: 5 user stories, ~15 new/modified files per app, 3 new Prisma models

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Architectural Purity**: No direct inter-app imports; shared logic in `packages/`
- [x] **II. Sub-System Consistency**: Backend modules follow `src/modules/[feature]`; frontend parity maintained; shared UI components extracted
- [x] **III. Jewellery Brand Protocols**: AED  currency only; AR/EN translations provided; Stripe standard only (no Connect)
- [x] **IV. Media & Search**: Cloudinary for all media assets; search analytics tracked in backend
- [x] **V. Structural Cleanliness**: Cross-app types/utils extracted to packages; no duplicated business logic

All gates pass. New types (`ProductBadge`, `JewelleryAttribute`, `SearchAnalyticsEvent`,
`PaymentSession`) will be added to `packages/shared-types/`. New utilities (badge display
logic, AED  formatting) will be added to `packages/shared-utils/`.

## Project Structure

### Documentation (this feature)

```text
specs/001-jewellery-ecommerce-transform/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── stripe-webhook.md
│   ├── search-api.md
│   └── payment-api.md
└── tasks.md             # Phase 2 output (NOT created by this command)
```

### Source Code (repository root)

```text
apps/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── payment/         # NEW — Stripe checkout + webhook
│   │   │   │   ├── index.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── model.ts
│   │   │   ├── search/          # MODIFY — enhance with trending, analytics, extended fields
│   │   │   │   ├── index.ts
│   │   │   │   ├── service.ts   # NEW — extracted business logic
│   │   │   │   └── model.ts     # NEW — validation schemas
│   │   │   ├── analytics/       # MODIFY — add search event types
│   │   │   ├── product/         # MODIFY — add badge, trending, jewellery attributes
│   │   │   ├── collection/      # MODIFY — add banner fields
│   │   │   └── ...
│   │   └── index.ts             # MODIFY — register payment module
│   └── prisma/
│       └── schema/
│           ├── product.prisma       # MODIFY — add badge, isTrending, jewellery attributes
│           ├── attribute.prisma     # MODIFY — add Material, Stone, Clarity models
│           ├── collection.prisma    # MODIFY — add banner fields to CollectionImage
│           └── order.prisma         # MODIFY — add paymentMethod, stripeSessionId
├── marketing/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── product-card.tsx        # MODIFY — badges, zoom, wishlist icon
│   │   │   │   └── search-overlay.tsx      # RENAME from global-search.tsx — full overlay
│   │   │   └── layout/
│   │   │       └── header.tsx              # MODIFY — wire new search overlay
│   │   ├── app/
│   │   │   └── [locale]/
│   │   │       ├── checkout/
│   │   │       │   └── success/
│   │   │       │       └── page.tsx        # NEW — order confirmation page
│   │   │       └── checkout/
│   │   │           └── cancel/
│   │   │               └── page.tsx        # NEW — payment failure page
│   │   └── styles/
│   │       └── globals.css                 # MODIFY — luxury design system
│   └── messages/
│       ├── en.json                         # MODIFY — add new translation keys
│       └── ar.json                         # MODIFY — add new translation keys
└── cms/
    └── src/
        └── pages/
            ├── products/
            │   ├── new.tsx              # MODIFY — badge, trending, jewellery attributes
            │   └── edit.tsx             # MODIFY — badge, trending, jewellery attributes
            ├── collections.tsx          # MODIFY — banner management
            ├── materials.tsx            # NEW — Material attribute CRUD
            ├── stones.tsx               # NEW — Stone attribute CRUD
            └── clarities.tsx            # NEW — Clarity attribute CRUD

packages/
├── shared-types/
│   └── src/
│       ├── product.ts                # MODIFY — add ProductBadge, badge/trending fields
│       ├── payment.ts                # NEW — PaymentSession type
│       ├── search.ts                 # NEW — SearchEvent, TrendingProduct types
│       └── index.ts                  # MODIFY — re-export new modules
└── shared-utils/
    └── src/
        ├── constants.ts              # MODIFY — add PRODUCT_BADGES, PAYMENT_METHODS
        └── index.ts
```

**Structure Decision**: Option 4 (Monorepo with `apps/` + `packages/`). The existing
monorepo structure is retained and extended. New modules follow the established
three-file pattern (index.ts, service.ts, model.ts).

## Complexity Tracking

> No constitution violations. All changes follow established patterns.
