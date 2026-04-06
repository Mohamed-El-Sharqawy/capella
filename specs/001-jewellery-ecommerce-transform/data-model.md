# Data Model: Jewellery E-commerce Transformation

**Feature Branch**: `001-jewellery-ecommerce-transform`
**Date**: 2026-04-06

## Schema Changes

### Product Model Extensions

**File**: `apps/backend/prisma/schema/product.prisma`

New enum:

```prisma
enum ProductBadge {
  NEW
  BESTSELLER
  LIMITED_EDITION
}
```

Add to `Product` model:

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `badge` | `ProductBadge?` | `null` | Nullable enum |
| `isTrending` | `Boolean` | `false` | Manual trending flag |
| `materialId` | `String?` | — | FK to Material |
| `stoneId` | `String?` | — | FK to Stone |
| `clarityId` | `String?` | — | FK to Clarity |

No changes to `ProductVariant`, `ProductImage`, or `ProductVariantImage`.

---

### New Attribute Models

**File**: `apps/backend/prisma/schema/attribute.prisma`

Three new models following the existing Color/Size pattern:

```prisma
model Material {
  id        String   @id @default(cuid())
  nameEn    String   @unique
  nameAr    String   @unique
  position  Int      @default(0)
  products  Product[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([nameEn])
  @@unique([nameAr])
  @@map("materials")
}

model Stone {
  id        String   @id @default(cuid())
  nameEn    String   @unique
  nameAr    String   @unique
  position  Int      @default(0)
  products  Product[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([nameEn])
  @@unique([nameAr])
  @@map("stones")
}

model Clarity {
  id        String   @id @default(cuid())
  nameEn    String   @unique
  nameAr    String   @unique
  position  Int      @default(0)
  products  Product[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([nameEn])
  @@unique([nameAr])
  @@map("clarities")
}
```

**Rationale**: Same pattern as Color/Size. Independent entities with
bilingual names, position for sorting, and one-to-many relationship to
Product. Each product can have at most one Material, one Stone, one Clarity
(nullable FK).

---

### Collection Banner Extension

**File**: `apps/backend/prisma/schema/collection.prisma`

Add to `Collection` model:

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `bannerTitleEn` | `String?` | — | Banner heading (English) |
| `bannerTitleAr` | `String?` | — | Banner heading (Arabic) |
| `bannerDescriptionEn` | `String?` | — | Banner description (English) |
| `bannerDescriptionAr` | `String?` | — | Banner description (Arabic) |
| `bannerCtaTextEn` | `String?` | — | CTA button text (English) |
| `bannerCtaTextAr` | `String?` | — | CTA button text (Arabic) |

New model:

```prisma
model CollectionBanner {
  id           String     @id @default(cuid())
  collectionId String     @unique
  url          String
  publicId     String
  altEn        String?
  altAr        String?
  collection   Collection @relation(fields: [collectionId], onDelete: Cascade)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  @@map("collection_banners")
}
```

**Rationale**: Separate model from `CollectionImage` because banners have
distinct fields (CTA text, bilingual title/description). One-to-one with
Collection. Cascade delete on collection removal.

---

### Order Payment Fields

**File**: `apps/backend/prisma/schema/order.prisma`

Add to `Order` model:

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `paymentMethod` | `String?` | — | "STRIPE" or "COD" |
| `stripeSessionId` | `String?` | — | Unique, Stripe checkout session ID |
| `paidAt` | `DateTime?` | — | Timestamp of successful payment |

`stripeSessionId` has `@unique` constraint for idempotency lookups.

No changes to `OrderItem` or `OrderStatus` enum.

---

### Search Analytics (No Schema Changes)

The existing `AnalyticsEvent` model supports generic event types via the
`type` string field. New event types to track:

- `search.query` — payload: `{ query, resultCount }`
- `search.click` — payload: `{ query, productId }`

No schema changes needed. The existing `AnalyticsDailyStat` handles
aggregation.

**Raw event retention**: Delete `AnalyticsEvent` records where
`type IN ('search.query', 'search.click')` and `createdAt < now() - 90 days`.

**Daily stat retention**: Indefinite (existing pattern).

---

## Entity Relationships

```text
Material  1──* Product  (product.materialId -> material.id)
Stone     1──* Product  (product.stoneId -> stone.id)
Clarity   1──* Product  (product.clarityId -> clarity.id)
Collection 1──1 CollectionBanner (collectionBanner.collectionId -> collection.id)
Order     1──1 Payment Session (order.stripeSessionId, unique)
```

## Validation Rules

- `ProductBadge`: Must be NEW, BESTSELLER, LIMITED_EDITION, or null
- `materialId`, `stoneId`, `clarityId`: All nullable FK — product
  can have zero or one of each
- `CollectionBanner`: Optional — collection can exist with or without
  a banner
- `stripeSessionId`: Must be unique when present
- `paymentMethod`: Required when `stripeSessionId` is present (must be
  "STRIPE")

## State Transitions

### Payment Flow

```text
Cart → POST /api/payments/checkout
  → Creates Order (PENDING) + Stripe session
  → Redirect to Stripe-hosted checkout
  → Payment success → Webhook (checkout.session.completed)
    → Verify idempotency (skip if order already PAID)
    → Re-validate stock (refund if out of stock)
    → Update order to PAID, set paidAt
    → Redirect customer to /checkout/success
  → Payment failed/cancelled
    → Redirect customer to /checkout/cancel (cart preserved)
  → Session expired → Webhook (checkout.session.expired)
    → Update order to CANCELLED
```

### Search Event Lifecycle

```text
User opens search overlay → Fetch trending products (GET /api/search/trending)
User types query → Debounced 300ms → GET /api/search?q=...
  → POST /api/search/analytics/query (record search.query event)
User clicks result → Navigate to product page
  → POST /api/search/analytics/click (record search.click event)
Daily aggregation → AnalyticsDailyStat (type: search.query / search.click)
Raw events → Deleted after 90 days
```
