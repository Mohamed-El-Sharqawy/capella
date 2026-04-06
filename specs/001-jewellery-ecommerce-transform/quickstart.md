# Quickstart: Jewellery E-commerce Transformation

**Feature Branch**: `001-jewellery-ecommerce-transform`
**Date**: 2026-04-06

## Prerequisites

- Node.js >= 20, Bun, pnpm >= 9
- Stripe account (test mode for development)
- Cloudinary account (already configured)
- PostgreSQL connection via Neon (already configured)

## Environment Setup

### Backend (.env)

```bash
# Existing vars (unchanged)
DATABASE_URL="postgresql://..."

# New — add Stripe keys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
MARKETING_URL="http://localhost:3000"
```

### Marketing (.env.local)

No new environment variables required. Stripe redirect URLs
use the `MARKETING_URL` from backend config.

## Database Migration

After pulling the feature branch, run migrations for the new schema:

```bash
# Generate Prisma client with new models
pnpm db:generate

# Run migration to add new tables and columns
pnpm db:migrate
```

### What the migration adds:

- `ProductBadge` enum
- `badge`, `isTrending`, `materialId`, `stoneId`, `clarityId` columns on `Product`
- `Material`, `Stone`, `Clarity` tables
- `CollectionBanner` table + banner fields on `Collection`
- `paymentMethod`, `stripeSessionId`, `paidAt` columns on `Order`

## Development Workflow

### 1. Start all apps

```bash
pnpm dev
```

### 2. Verify backend

- Open http://localhost:3001/swagger — confirm new endpoints appear
- Test `GET /api/search/trending` — should return trending products
- Test `POST /api/payments/checkout` with cart items

### 3. Verify marketing storefront

- Open http://localhost:3000/en — check serif typography loads
- Navigate to a collection page — verify banner renders
- Click search icon — verify full-width overlay with trending section
- Browse product listing — verify badges, zoom, wishlist icon

### 4. Verify CMS

- Open http://localhost:5173
- Navigate to Products > New — verify badge selector and jewellery attribute fields
- Navigate to Materials/Stones/Clarities pages — verify CRUD
- Edit a collection — verify banner upload

### 5. Test Stripe flow (end-to-end)

- Open http://localhost:3001/swagger
- Use `POST /api/payments/checkout` to create a session
- Complete payment in Stripe test mode
- Verify redirect to success page
- Verify webhook updates via Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3001/api/payments/webhook
  ```

### 6. Test search analytics
- Perform several searches on the storefront
- Check `GET /api/search/analytics/queries` (admin) for recorded data
- Verify trending products update based on search activity

## Shared Package Updates

After adding new types to `packages/shared-types/`:

```bash
# From repo root
pnpm build
```

This ensures all workspaces can compile with the updated types.

## Arabic (RTL) Verification

- Switch language to Arabic using thelocale switcher
- Verify all new UI elements render correctly in RTL
- Check product cards, search overlay, and checkout pages
