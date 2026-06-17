# Meta Events Deduplication Fixes - Implementation Plan

## Overview

This plan addresses the 3 critical deduplication issues identified in the assessment:
1. AddToCart - Duplicate events due to mismatched event IDs
2. RemoveFromCart - Duplicate events due to mismatched event IDs
3. InitiateCheckout - Duplicate events due to mismatched event IDs

## Chosen Approach: Frontend-Generated Event IDs

Following the pattern used by the Lead event, we will:
1. Frontend generates the event ID
2. Frontend sends event ID to backend in request body
3. Backend uses the same event ID for CAPI
4. Frontend uses the same event ID for pixel event

This approach ensures both channels use identical event IDs for proper deduplication.

---

## Fix 1: AddToCart Deduplication

### Files to Modify

#### Frontend Changes

**1. [`apps/marketing/src/lib/analytics.ts`](apps/marketing/src/lib/analytics.ts:117-142)**

Update `trackQuickAddToCart()` to generate and use event ID:

```typescript
export function trackQuickAddToCart(
  productId: string, 
  variantId: string,
  productName?: string,
  price?: number,
  quantity?: number
): void {
  // Generate event ID for deduplication
  const eventId = `cart_${variantId}_${Date.now()}`;

  trackEvent("cart-add", {
    productId,
    variantId,
    source: "quick_add",
    fbp: getFbp(),
    fbc: getFbc(),
    value: price,
    contentIds: [variantId],
    contentName: productName || productId,
    eventId, // Pass to backend
  });

  // Facebook Pixel - use same event ID
  fbAddToCart({
    contentId: variantId,
    contentName: productName || productId,
    value: price || 0,
    quantity: quantity || 1,
    eventId, // Pass to pixel
  });
}
```

**2. [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:71-91)**

Update `fbAddToCart()` to accept and use `eventId` parameter:

```typescript
export function fbAddToCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
  quantity?: number;
  eventId?: string; // Add this parameter
}): void {
  const eventData: Record<string, unknown> = {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: "product",
    value: params.value,
    currency: params.currency || "AED",
    contents: [
      {
        id: params.contentId,
        quantity: params.quantity || 1,
      },
    ],
  };

  if (params.eventId) {
    fbq("track", "AddToCart", eventData, { eventID: params.eventId });
  } else {
    fbq("track", "AddToCart", eventData);
  }
}
```

#### Backend Changes

**3. [`apps/backend/src/modules/analytics/index.ts`](apps/backend/src/modules/analytics/index.ts:144-188)**

Update `/track/cart-add` endpoint to use event ID from request body:

```typescript
.post(
  "/track/cart-add",
  async ({ body, headers }) => {
    const sessionId = headers["x-session-id"] as string | undefined;
    const userAgent = headers["user-agent"] as string | undefined;
    const ip =
      (headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (headers["x-real-ip"] as string) ||
      undefined;

    await analyticsService.track({
      type: "cart.add",
      sessionId,
      productId: body.productId,
      data: { variantId: body.variantId, source: body.source },
    });

    // Use eventId from request body instead of generating new one
    await sendMetaEvent({
      eventName: "AddToCart",
      userAgent,
      ip,
      fbp: body.fbp,
      fbc: body.fbc,
      value: body.value,
      contentIds: body.contentIds,
      contentType: "product",
      contentName: body.contentName,
      eventId: body.eventId, // Use from frontend
    });

    return { success: true as const };
  },
  {
    body: t.Object({
      productId: t.String(),
      variantId: t.String(),
      source: t.Optional(t.String()),
      fbp: t.Optional(t.String()),
      fbc: t.Optional(t.String()),
      value: t.Optional(t.Number()),
      contentIds: t.Optional(t.Array(t.String())),
      contentName: t.Optional(t.String()),
      eventId: t.Optional(t.String()), // Add this field
    }),
  }
)
```

---

## Fix 2: RemoveFromCart Deduplication

### Files to Modify

#### Frontend Changes

**1. [`apps/marketing/src/lib/analytics.ts`](apps/marketing/src/lib/analytics.ts:147-169)**

Update `trackCartRemove()` to generate and use event ID:

```typescript
export function trackCartRemove(
  productId: string, 
  variantId: string,
  productName?: string,
  price?: number
): void {
  // Generate event ID for deduplication
  const eventId = `cart_remove_${variantId}_${Date.now()}`;

  trackEvent("cart-remove", {
    productId,
    variantId,
    fbp: getFbp(),
    fbc: getFbc(),
    value: price,
    contentIds: [variantId],
    contentName: productName || productId,
    eventId, // Pass to backend
  });

  // Facebook Pixel - use same event ID
  fbRemoveFromCart({
    contentId: variantId,
    contentName: productName || productId,
    value: price || 0,
    eventId, // Pass to pixel
  });
}
```

**2. [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:96-107)**

Update `fbRemoveFromCart()` to accept and use `eventId` parameter:

```typescript
export function fbRemoveFromCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  eventId?: string; // Add this parameter
}): void {
  const eventData: Record<string, unknown> = {
    content_ids: [params.contentId],
    content_name: params.contentName,
    value: params.value,
    currency: "AED",
  };

  if (params.eventId) {
    fbq("trackCustom", "RemoveFromCart", eventData, { eventID: params.eventId });
  } else {
    fbq("trackCustom", "RemoveFromCart", eventData);
  }
}
```

#### Backend Changes

**3. [`apps/backend/src/modules/analytics/index.ts`](apps/backend/src/modules/analytics/index.ts:190-228)**

Update `/track/cart-remove` endpoint to use event ID from request body:

```typescript
.post(
  "/track/cart-remove",
  async ({ body, headers }) => {
    const sessionId = headers["x-session-id"] as string | undefined;
    const userAgent = headers["user-agent"] as string | undefined;
    const ip =
      (headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (headers["x-real-ip"] as string) ||
      undefined;

    await analyticsService.track({
      type: "cart.remove",
      sessionId,
      productId: body.productId,
      data: { variantId: body.variantId },
    });

    // Use eventId from request body instead of generating new one
    await sendMetaEvent({
      eventName: "RemoveFromCart",
      userAgent,
      ip,
      fbp: body.fbp,
      fbc: body.fbc,
      value: body.value,
      contentIds: body.contentIds,
      contentName: body.contentName,
      eventId: body.eventId, // Use from frontend
    });

    return { success: true as const };
  },
  {
    body: t.Object({
      productId: t.String(),
      variantId: t.String(),
      fbp: t.Optional(t.String()),
      fbc: t.Optional(t.String()),
      value: t.Optional(t.Number()),
      contentIds: t.Optional(t.Array(t.String())),
      contentName: t.Optional(t.String()),
      eventId: t.Optional(t.String()), // Add this field
    }),
  }
)
```

---

## Fix 3: InitiateCheckout Deduplication

### Files to Modify

#### Frontend Changes

**1. [`apps/marketing/src/lib/analytics.ts`](apps/marketing/src/lib/analytics.ts:202-221)**

Update `trackCheckoutView()` to generate and use event ID:

```typescript
export function trackCheckoutView(
  cartItemCount: number, 
  cartTotal: number,
  variantIds?: string[]
): void {
  // Generate event ID for deduplication
  const eventId = `checkout_${getSessionId()}_${Date.now()}`;

  trackEvent("checkout-view", {
    cartItemCount,
    cartTotal,
    fbp: getFbp(),
    fbc: getFbc(),
    contentIds: variantIds || [],
    eventId, // Pass to backend
  });

  // Facebook Pixel - use same event ID
  fbInitiateCheckout({
    contentIds: variantIds || [],
    value: cartTotal,
    numItems: cartItemCount,
    eventId, // Pass to pixel
  });
}
```

**2. [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:112-124)**

Update `fbInitiateCheckout()` to accept and use `eventId` parameter:

```typescript
export function fbInitiateCheckout(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
  eventId?: string; // Add this parameter
}): void {
  const eventData: Record<string, unknown> = {
    content_ids: params.contentIds,
    value: params.value,
    currency: params.currency || "AED",
    num_items: params.numItems,
  };

  if (params.eventId) {
    fbq("track", "InitiateCheckout", eventData, { eventID: params.eventId });
  } else {
    fbq("track", "InitiateCheckout", eventData);
  }
}
```

#### Backend Changes

**3. [`apps/backend/src/modules/analytics/index.ts`](apps/backend/src/modules/analytics/index.ts:327-346)**

Update `/track/checkout-view` endpoint to use event ID from request body:

```typescript
.post(
  "/track/checkout-view",
  async ({ body, headers }) => {
    const sessionId = headers["x-session-id"] as string | undefined;
    const userAgent = headers["user-agent"] as string | undefined;
    const ip =
      (headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (headers["x-real-ip"] as string) ||
      undefined;

    await analyticsService.track({
      type: "checkout.view",
      sessionId,
      data: {
        cartItemCount: body.cartItemCount,
        cartTotal: body.cartTotal,
        contentIds: body.contentIds,
      },
    });

    // Use eventId from request body instead of generating new one
    await sendMetaEvent({
      eventName: "InitiateCheckout",
      userAgent,
      ip,
      fbp: body.fbp,
      fbc: body.fbc,
      value: body.cartTotal,
      contentIds: body.contentIds,
      numItems: body.cartItemCount,
      eventId: body.eventId, // Use from frontend
    });

    return { success: true as const };
  },
  {
    body: t.Object({
      cartItemCount: t.Number(),
      cartTotal: t.Number(),
      fbp: t.Optional(t.String()),
      fbc: t.Optional(t.String()),
      contentIds: t.Optional(t.Array(t.String())),
      eventId: t.Optional(t.String()), // Add this field
    }),
  }
)
```

---

## Implementation Order

1. **Frontend changes first** - Update pixel functions to accept `eventId` parameter
2. **Frontend analytics** - Update tracking functions to generate and pass event IDs
3. **Backend changes** - Update endpoints to use event IDs from request body
4. **Testing** - Verify deduplication works correctly

---

## Testing Checklist

After implementing all fixes:

- [ ] Add item to cart → Events Manager shows **ONE** AddToCart event
- [ ] Remove item from cart → Events Manager shows **ONE** RemoveFromCart event
- [ ] Go to checkout → Events Manager shows **ONE** InitiateCheckout event
- [ ] Complete COD order → Events Manager shows **ONE** Purchase event
- [ ] Complete Ziina order → Events Manager shows **ONE** Purchase event
- [ ] Register new account → Events Manager shows **ONE** CompleteRegistration event
- [ ] Submit contact form → Events Manager shows **ONE** Lead event
- [ ] Event Match Quality score should be 6+ (fbp + hashed email = good match)

---

## Verification Steps

1. Open Meta Events Manager
2. Go to Test Events
3. Enable test mode with `META_TEST_EVENT_CODE` environment variable
4. Perform each action:
   - Add item to cart
   - Remove item from cart
   - Go to checkout page
5. Verify each event appears only once in the test events stream
6. Check that event IDs match between pixel and CAPI events

---

## Summary of Changes

| File | Changes |
|------|---------|
| `apps/marketing/src/lib/analytics.ts` | Add `eventId` generation to `trackQuickAddToCart`, `trackCartRemove`, `trackCheckoutView` |
| `apps/marketing/src/lib/facebook-pixel.ts` | Add `eventId` parameter to `fbAddToCart`, `fbRemoveFromCart`, `fbInitiateCheckout` |
| `apps/backend/src/modules/analytics/index.ts` | Update `/track/cart-add`, `/track/cart-remove`, `/track/checkout-view` to use `eventId` from request body |

---

## Risk Assessment

**Low Risk** - These changes:
- Are backward compatible (eventId is optional)
- Follow existing patterns from Lead event
- Don't change business logic
- Only affect analytics tracking

**Mitigation:**
- Test in development environment first
- Use test event codes to verify
- Monitor production after deployment