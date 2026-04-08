# Research: Jewellery E-commerce Transformation

**Feature Branch**: `001-jewellery-ecommerce-transform`
**Date**: 2026-04-06

## Research Areas

### R1: Stripe Checkout Integration (Redirect Mode)

**Decision**: Use Stripe Checkout Sessions in redirect mode (server-side
session creation, customer redirected to Stripe-hosted payment page).

**Rationale**:
- Minimal PCI compliance scope — card data never touches our servers.
- Stripe handles payment UI, 3D Secure, and Apple/Google Pay natively.
- Aligns with the constitution: Stripe standard business account only.
- AED  is a supported currency for Stripe Checkout.
- Webhook-based confirmation with idempotency keyed on session ID.

**Alternatives Considered**:
- **Stripe Elements (embedded)**: More control over UI but higher PCI scope
  and significantly more frontend complexity. Rejected — not worth the
  effort for a single-currency, single-business setup.
- **Stripe Payment Intents (API-only)**: Full control but requires building
  the entire payment form. Rejected — overkill for this use case.

**Key Integration Points**:
- Backend: `stripe` npm package, `stripe.checkout.sessions.create()`
- Success URL: `{MARKETING_URL}/{locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `{MARKETING_URL}/{locale}/checkout/cancel`
- Webhook endpoint: `POST /api/payments/webhook` with `stripe.webhooks.constructEvent()`
- Events to handle: `checkout.session.completed`, `checkout.session.expired`

### R2: Jewellery Attribute Data Model

**Decision**: Create three new independent entity models (Material, Stone,
Clarity) following the exact same pattern as existing Color/Size — each
with `nameEn`, `nameAr`, and their own CRUD module. Link them to the
Product model (not ProductVariant) via foreign keys.

**Rationale**:
- Material, Stone, and Clarity are properties of the jewellery piece itself,
  not of a size/color variant. A ring made of 18K gold with a diamond
  remains so regardless of ring size.
- Following the Color/Size pattern ensures consistency with the existing
  codebase — same CMS page structure, same backend module structure.
- Product-level FK keeps the schema simple and avoids nullable junction
  tables.
- The existing attribute pattern (independent entity + FK on target) is
  proven and well-understood in this codebase.

**Alternatives Considered**:
- **Generic EAV (Entity-Attribute-Value)**: Maximum flexibility but adds
  query complexity and loses type safety. Rejected — only 3 fixed
  jewellery attributes needed.
- **JSON column on Product**: Flexible but unqueryable, no referential
  integrity. Rejected — contradicts the structured data approach.
- **Variant-level attributes**: Would duplicate Material/Stone/Clarity
  across every variant. Rejected — jewellery attributes are inherent
  to the piece, not the variant.

### R3: Search Strategy Enhancement

**Decision**: Keep PostgreSQL-based search but expand with additional
fields (SKU, meta tags, jewellery attributes) and add a dedicated
trending endpoint backed by analytics aggregation.

**Rationale**:
- Current `Prisma.findMany` with `contains` + `mode: "insensitive"` works
  for the current scale. No need to introduce Elasticsearch/Meilisearch.
- PostgreSQL `ILIKE` is sufficient for a jewellery catalog (hundreds to
  low thousands of products, not millions).
- Adding jewellery attribute joins to the search query enables filtering
  by material/stone/clarity.
- The trending endpoint queries `AnalyticsDailyStat` aggregated by
  product search frequency — no new infrastructure needed.
- Predictive/autocomplete behavior achieved via debounced frontend calls
  to the existing search endpoint.

**Alternatives Considered**:
- **PostgreSQL full-text search (tsvector)**: Better relevance ranking but
  requires migration to add tsvector columns and trigger-based index
  maintenance. Deferred — current scale doesn't warrant it.
- **Meilisearch/Algolia**: Purpose-built for instant search but adds
  infrastructure cost and sync complexity. Deferred — can be added
  later if scale demands it.

### R4: Luxury Design System Implementation

**Decision**: Apply a monochrome palette with serif headings and
sans-serif body via Tailwind CSS configuration. Use Framer Motion
(already installed) for animations.

**Rationale**:
- Framer Motion is already a dependency in the Marketing app — no new
  packages needed.
- Tailwind CSS v4 supports custom theme extensions natively — fonts,
  colors, and spacing can be configured in `globals.css` using
  `@theme` directive.
- The monochrome palette (#f4f4f4, #ffffff, #000000) maps to Tailwind
  custom colors.
- Google Fonts (Playfair Display + Inter) loaded via `next/font` for
  optimal performance (no layout shift, self-hosted).
- Product card hover zoom: CSS transform + transition on `group-hover`
  — no JS needed.

**Alternatives Considered**:
- **Headless UI animations**: Less control than Framer Motion. Rejected —
  Framer Motion already available.
- **Custom CSS animations only**: Works for simple cases but Framer Motion
  provides better layout animations for the search overlay.

### R5: Collection Banner Extension

**Decision**: Extend the existing `CollectionImage` model or add banner
fields directly to the `Collection` model. Add `bannerTitleEn/Ar`,
`bannerDescriptionEn/Ar`, and use the existing Cloudinary upload pipeline.

**Rationale**:
- The Collection model already has a `CollectionImage` relation for the
  thumbnail. The banner is a separate visual element.
- Adding banner fields to Collection directly (rather than a separate
  model) keeps it simple — one banner per collection.
- Cloudinary upload is already implemented in the Image module — CMS can
  reuse the same endpoint.

**Alternatives Considered**:
- **Separate CollectionBanner model**: More normalized but adds complexity
  for a 1:1 relationship. Rejected — over-engineering.
- **Reusable Banner system**: Could share banners across collections but
  no requirement for this. Rejected — YAGNI.

### R6: Search Analytics Tracking

**Decision**: Extend the existing `AnalyticsEvent` model with new event
types (`search.query`, `search.click`) and add a dedicated analytics
aggregation cron/query for trending.

**Rationale**:
- The existing analytics infrastructure already supports generic events
  with `type`, `data` (JSON), and denormalized filter fields.
- Search events fit naturally: `type: "search.query"`, `data: { query,
  resultCount }`, and `type: "search.click"`, `data: { query,
  productId }`.
- The existing `AnalyticsDailyStat` aggregation pattern can be extended
  for search-specific daily stats.
- Raw events retained for 90 days per spec requirement, daily stats
  retained indefinitely.

**Alternatives Considered**:
- **Dedicated SearchEvent table**: More structured but duplicates the
  existing analytics pattern. Rejected — reuse what exists.
- **Client-side analytics only (e.g., Google Analytics)**: No backend
  access for trending endpoint. Rejected — need server-side data.
