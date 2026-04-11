# Jewellery E-commerce Transformation Plan (Samra.com Inspired)

This plan outlines the steps to transform the current `capella` monorepo into a premium jewellery e-commerce platform, matching the aesthetics, UX, and functionality of [Samra](https://samra.com).

## User Review Required

> [!IMPORTANT]
> **Brand Identity**: Confirmed as a premium jewellery brand (like Samra). All placeholder logic will follow this theme. Images will be managed via CMS/Cloudinary by the user.
> **Payments**: Stripe is the confirmed payment provider.
> **Search**: Enhancing the existing search to match Samra's premium predictive behavior.

## Proposed Changes

### 1. Backend Analysis & Modifications (`apps/backend`)

The current schema is robust but needs small additions to support the rich Samra experience and Stripe payments.

#### [NEW] Stripe Integration
- Implement `StripeModule` for AED  transactions.
- Standard business account integration (non-Connect).
- Create `/payments/checkout` endpoint for session creation.
- Create `/payments/webhook` for handling successful payments and updating order statuses.

#### [MODIFY] [product.prisma](file:///d:/Work/capella/apps/backend/prisma/schema/product.prisma)
- Add a `badge` field (e.g., `enum ProductBadge { NEW, BESTSELLER, LIMITED_EDITION }`) to show labels on cards.
- Add `isTrending` boolean for search/hero highlighting.

#### [MODIFY] [search/index.ts](file:///d:/Work/capella/apps/backend/src/modules/search/index.ts)
- Enhance search logic to include more fields (SKU, meta tags).
- Add a "Trending/Popular" results endpoint to populate the search overlay when query is empty.

#### [MODIFY] [attribute.prisma](file:///d:/Work/capella/apps/backend/prisma/schema/attribute.prisma)
- Expand attributes beyond `Color` and `Size` to include jewellery-specific specs like `Material` (18K Gold, White Gold), `Stone` (Diamond, Emerald), and `Clarity`.

---

### 2. CMS Enhancements (`apps/cms`)

The CMS must be updated to manage the new jewellery data points.

#### [MODIFY] [products.tsx](file:///d:/Work/capella/apps/cms/src/pages/products.tsx)
- Update forms to handle new `badge` selections.
- Add support for managing multiple specific jewellery attributes.

#### [MODIFY] [collections.tsx](file:///d:/Work/capella/apps/cms/src/pages/collections.tsx)
- Add banner management for collection-specific hero sections (as seen in "Quwa Motif").

---

### 3. Marketing App Facelift (`apps/marketing`)

This is where the major visual and interactive changes will occur.

#### [MODIFY] [globals.css](file:///d:/Work/capella/apps/marketing/src/app/globals.css)
- Implement a new design system:
    - **Typography**: Import premium Serif fonts (e.g., Playfair Display or Cormorant Garamond) for headings and clean Sans-serif (e.g., Inter or Montserrat) for body.
    - **Palette**: Use `#f4f4f4`, `#ffffff`, and deep black `#000000`.
    - **Spacing**: Increase white space and padding for a luxury feel.

#### [MODIFY] [ProductCard.tsx](file:///d:/Work/capella/apps/marketing/src/components/ProductCard.tsx) (New or existing)
- Add hover zoom animation on images.
- Implement "Wishlist" heart icon overlay.
- Display "NEW" or "BESTSELLER" badges gracefully.

#### [MODIFY] [global-search.tsx](file:///d:/Work/capella/apps/marketing/src/components/layout/global-search.tsx)
- Transform the dropdown into a **Full-Width Premium Overlay** with smooth fade/slide transitions.
- Add "Recent Searches" (stored in `localStorage`).
- Add "Trending Now" section (fetched from the updated backend).
- Improve visual hierarchy of results with larger images and better typography.

#### [NEW] Stripe Checkout Flow
- Integrate Stripe Elements or redirect to Stripe Checkout (AED  only).
- Implementation of order success/failure pages.


## Verification Plan

### Automated Tests
- `npm run test` in all apps to ensure no regressions.
- Cypress/Playwright flows for "Add to Cart" and "Filtering".

### Manual Verification
- Visual audit against Samra.com for typography, spacing, and animations.
- Test mobile responsiveness of the new mega menu and filter sidebar.
