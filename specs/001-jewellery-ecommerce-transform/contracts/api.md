# API Contracts: Jewellery E-commerce Transformation

**Feature Branch**: `001-jewellery-ecommerce-transform`
**Date**: 2026-04-06
**Base URL**: `/api`

## Payment Endpoints

### POST /api/payments/checkout

Create a Stripe Checkout session and redirect customer to payment.

**Auth**: Required (`isSignIn: true`)

**Request Body**:
```json
{
  "items": [
    { "variantId": "string", "quantity": 1 }
  ],
  "shippingAddress": {
    "firstName": "string",
    "lastName": "string",
    "street": "string",
    "city": "string",
    "state": "string?",
    "zipCode": "string",
    "country": "string",
    "phone": "string"
  },
  "couponCode": "string?"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_xxx",
    "url": "https://checkout.stripe.com/..."
  }
}
```

**Error** (400):
```json
{
  "success": false,
  "error": "Out of stock: product X no longer available"
}
```

**Side Effects**:
- Validates all items exist and are in stock (`stock > 0`)
- Verifies coupon code if provided
- Calculates order total
- Creates Stripe Checkout session with AED line items
- Creates order in PENDING status with `stripeSessionId`
- Returns Stripe redirect URL

 session ID

---

### POST /api/payments/webhook

 Handle Stripe webhook events (public, no auth).

**Request**: Raw body (Stripe signature in header as `Stripe-Signature`)

**Response** (200):
```json
{ "received": true }
```

**Error** (400):
```json
{ "success": false, "error": "Invalid signature" }
```

**Events Handled**:
- `checkout.session.completed`: Verify idempotency via session ID, update order to PAID, set `paidAt`
 timestamp
 Re-validate stock, refund if out of stock
- `checkout.session.expired`: Update order to CANCELLED

**Idempotency**: Skip processing if `stripeSessionId` already processed for a paid/expaid/cancelled order

 **Stock Validation**:
- At session creation: Reject checkout with error if any item `stock <= 0`
- At webhook: Re-validate stock. If out of stock, issue refund via Stripe and set order to REFUNDED status

 **Security**: Verify `Stripe-Signature` header using `STRIPE_WEBHOOK_SECRET` env var. Use `stripe.webhooks.constructEvent()` with raw body

 Never trust JSON-parsed body

 always use the raw body buffer

---

## Search Endpoints

### GET /api/search?q={query}

Search products and collections by query string.

**Auth**: None (public)

**Query Params**:
```json
{ "q": "string (optional, min 2 chars)" }
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "string",
        "slug": "string",
        "nameEn": "string",
        "nameAr": "string",
        "price": 0,
        "imageUrl": "string",
        "badge": "NEW | null",
        "material": { "nameEn": "", "nameAr": "" } | null,
        "stone": { "nameEn": "", "nameAr": "" } | null
 "badge": "NEW | null
 "badge": "NEW | null
 "badge": "NEW | null
 }
    ],
    "collections": [
      {
        "id": "string",
        "slug": "string",
        "nameEn": "string",
        "nameAr": "string",
        "imageUrl": "string"
      }
    ]
  }
}
```

**Behavior Changes** (from current):
 Search now also matches against `sku`, `metaTitleEn`, `metaTitleAr`, `metaDescriptionEn`, `metaDescriptionAr` fields
 Results include `badge`, `material`, and `stone` from product-level relations
 Only returns `isActive: true` entities

 Respectively ordered by `createdAt: "desc"`

---

### GET /api/search/trending

 Get trending products for search analytics.

**Auth**: None (public)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "slug": "string",
      "nameEn": "string",
      "nameAr": "string",
      "price": 0,
      "imageUrl": "string",
      "badge": "NEW | null"
    }
  ]
}
```

**Algorithm**:
1. Query `AnalyticsDailyStat` for `search.query` type, last 30 days, grouped by `productId`, ordered by `count` desc
2. If insufficient analytics data (< 5 products), supplement with products where `isTrending: true`
3. Return top 8 products

---

### POST /api/search/analytics/query

 Record a search query event.

**Auth**: None (public)

**Request Body**:
```json
{
  "query": "string",
  "resultCount": 0
}
```

**Response** (201):
```json
{ "success": true }
```

**Side Effect**: Creates `AnalyticsEvent` with type `search.query` and data `{ query, resultCount }`

---

### POST /api/search/analytics/click

 Record a search result click event.

**Auth**: None (public)

**Request Body**:
```json
{
  "query": "string",
  "productId": "string"
}
```

**Response** (201):
```json
{ "success": true }
```

**Side Effect**: Creates `AnalyticsEvent` with type `search.click` and data `{ query, productId }`

---

### GET /api/search/analytics/queries

 Get search analytics for admin dashboard.

**Auth**: Required (`isAdmin: true`)

**Query Params**:
```json
{ "page": "1", "limit": "20" }
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "topQueries": [
      { "query": "string", "count": 0, "avgResults": 0 }
    ],
    "zeroResultQueries": [
      { "query": "string", "count": 0 }
    ],
    "trendingProducts": [
      { "productId": "string", "nameEn": "string", "clicks": 0, "impressions": 0 }
    ]
  }
}
```

---

## Attribute Management Endpoints

### Material

- `GET /api/materials` — List all (public, supports ?page & ?limit)
- `GET /api/materials/:id` — Get one (admin)
- `POST /api/materials` — Create (admin)
- `PUT /api/materials/:id` — Update (admin)
- `DELETE /api/materials/:id` — Delete (admin)

### Stone

- `GET /api/stones` — List all (public)
- `POST /api/stones` — Create (admin)
- `PUT /api/stones/:id` — Update (admin)
- `DELETE /api/stones/:id` — Delete (admin)

### Clarity

- `GET /api/clarities` — List all (public)
- `POST /api/clarities` — Create (admin)
- `PUT /api/clarities/:id` — Update (admin)
- `DELETE /api/clarities/:id` — Delete (admin)

All follow the same request/response pattern as existing Color/Size endpoints.

 Each requires `nameEn`, `nameAr`, `position` fields.

---

## Product Endpoints (Modified)

### PUT /api/products/:id

Extended request body to support:

```json
{
  "badge": "NEW | BESTSELLER | LIMITED_EDITION | null",
  "isTrending": true,
  "materialId": "string | null",
  "stoneId": "string | null",
  "clarityId": "string | null",
  ...existing fields
}
```

---

## Collection Endpoints (Modified)

### PUT /api/collections/:id

Extended request body to support:

```json
{
  "bannerTitleEn": "string?",
  "bannerTitleAr": "string?",
  "bannerDescriptionEn": "string?",
  "bannerDescriptionAr": "string?",
  "bannerCtaTextEn": "string?",
  "bannerCtaTextAr": "string?",
  "bannerImage": { "url": "string", "publicId": "string", "altEn": "string?", "altAr": "string?" },
 null,
  ...existing fields
 }
```

---
