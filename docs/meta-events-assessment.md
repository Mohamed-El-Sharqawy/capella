# Meta Pixel Events Implementation Assessment

## Executive Summary

The current implementation of Meta Pixel events (CAPI + Browser Pixels) has **significant deduplication issues** that will lead to duplicate events being counted. While some events are correctly implemented with dual-channel deduplication, several critical events have mismatched event IDs between frontend and backend.

---

## Critical Issues Found

### 1. ❌ AddToCart Event - DUPLICATE EVENTS

**Severity: CRITICAL**

**Problem:** Frontend and backend generate different event IDs, causing duplicate events.

**Frontend Implementation:**
- [`apps/marketing/src/lib/analytics.ts`](apps/marketing/src/lib/analytics.ts:117-142) - Sends to internal analytics API
- [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:71-91) - `fbAddToCart()` does NOT include eventID parameter

**Backend Implementation:**
- [`apps/backend/src/modules/analytics/index.ts`](apps/backend/src/modules/analytics/index.ts:161-172) - Generates its own event ID: `cart_${body.variantId}_${Date.now()}`

**Result:**
- Frontend pixel event: NO event ID (or different)
- Backend CAPI event: `cart_${variantId}_${timestamp}`
- **Meta will count these as TWO separate events**

**Impact:**
- Inflated AddToCart metrics
- Wasted ad spend optimization
- Inaccurate funnel analysis

---

### 2. ❌ RemoveFromCart Event - DUPLICATE EVENTS

**Severity: CRITICAL**

**Problem:** Similar to AddToCart, frontend and backend generate different event IDs.

**Frontend Implementation:**
- [`apps/marketing/src/lib/analytics.ts`](apps/marketing/src/lib/analytics.ts:147-169) - Sends to internal analytics API
- [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:96-107) - `fbRemoveFromCart()` does NOT include eventID parameter

**Backend Implementation:**
- [`apps/backend/src/modules/analytics/index.ts`](apps/backend/src/modules/analytics/index.ts:207-226) - Generates its own event ID: `cart_remove_${body.variantId}_${Date.now()}`

**Result:**
- Frontend pixel event: NO event ID
- Backend CAPI event: `cart_remove_${variantId}_${timestamp}`
- **Meta will count these as TWO separate events**

---

### 3. ❌ InitiateCheckout Event - MISSING DEDUPLICATION

**Severity: HIGH**

**Problem:** Only frontend sends this event; backend sends it but without proper deduplication.

**Frontend Implementation:**
- [`apps/marketing/src/lib/analytics.ts`](apps/marketing/src/lib/analytics.ts:202-221) - Sends to internal analytics API
- [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:112-124) - `fbInitiateCheckout()` does NOT include eventID parameter

**Backend Implementation:**
- [`apps/backend/src/modules/analytics/index.ts`](apps/backend/src/modules/analytics/index.ts:327-346) - Generates its own event ID: `checkout_${sessionId}_${Date.now()}`

**Result:**
- Frontend pixel event: NO event ID
- Backend CAPI event: `checkout_${sessionId}_${timestamp}`
- **Meta will count these as TWO separate events**

---

### 4. ✅ Purchase Event (COD) - CORRECT DEDUPLICATION

**Status: GOOD**

**Frontend Implementation:**
- [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:162-165) - Uses `eventID: order_${orderId}`
- [`apps/marketing/src/app/[locale]/checkout/client.tsx`](apps/marketing/src/app/[locale]/checkout/client.tsx:120-131) - Waits for `orderSuccess` before firing

**Backend Implementation:**
- [`apps/backend/src/modules/order/service.ts`](apps/backend/src/modules/order/service.ts:245-257) - Uses `eventId: order_${order.id}`

**Result:**
- Both use the same event ID format: `order_{orderId}`
- **Meta will correctly deduplicate to ONE event**

---

### 5. ✅ Purchase Event (Ziina) - CORRECT SINGLE CHANNEL

**Status: GOOD**

**Implementation:**
- [`apps/backend/src/modules/payment/service.ts`](apps/backend/src/modules/payment/service.ts:306-318) - Backend only (user leaves site)
- Uses `eventId: order_${order.id}`

**Result:**
- Single channel event
- **Correctly implemented**

---

### 6. ✅ Lead Event - CORRECT DEDUPLICATION

**Status: GOOD**

**Frontend Implementation:**
- [`apps/marketing/src/app/[locale]/contact/hooks/use-contact-form.ts`](apps/marketing/src/app/[locale]/contact/hooks/use-contact-form.ts:30-39) - Generates `lead_${email}_${timestamp}`
- Passes to backend in request body

**Backend Implementation:**
- [`apps/backend/src/modules/contact/index.ts`](apps/backend/src/modules/contact/index.ts:23-34) - Uses `eventId: body.eventId`

**Result:**
- Both use the same event ID
- **Meta will correctly deduplicate to ONE event**

---

### 7. ✅ CompleteRegistration Event - CORRECT DEDUPLICATION

**Status: GOOD**

**Frontend Implementation:**
- [`apps/marketing/src/contexts/auth-context.tsx`](apps/marketing/src/contexts/auth-context.tsx:161) - Uses `eventId: data.data.eventId` (from backend response)

**Backend Implementation:**
- [`apps/backend/src/modules/auth/index.ts`](apps/backend/src/modules/auth/index.ts:25-38) - Generates `register_${user.id}` and returns in response

**Result:**
- Both use the same event ID
- **Meta will correctly deduplicate to ONE event**

---

### 8. ❌ Login Event - MISSING FRONTEND PIXEL

**Severity: MEDIUM**

**Problem:** Backend sends CAPI event but frontend doesn't send pixel event.

**Backend Implementation:**
- [`apps/backend/src/modules/auth/index.ts`](apps/backend/src/modules/auth/index.ts:67-78) - Sends CAPI event with `login_${user.id}_${Date.now()}`

**Frontend Implementation:**
- No pixel event found in [`apps/marketing/src/contexts/auth-context.tsx`](apps/marketing/src/contexts/auth-context.tsx)

**Result:**
- Single channel (CAPI only)
- Missing browser-side tracking

---

### 9. ✅ ViewContent Event - CORRECT SINGLE CHANNEL

**Status: GOOD**

**Implementation:**
- [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:38-52) - Pixel only
- No CAPI needed for view events

**Result:**
- **Correctly implemented**

---

### 10. ✅ Search Event - CORRECT SINGLE CHANNEL

**Status: GOOD**

**Implementation:**
- [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:174-182) - Pixel only
- No CAPI needed for search events

**Result:**
- **Correctly implemented**

---

### 11. ✅ AddPaymentInfo Event - CORRECT SINGLE CHANNEL

**Status: GOOD**

**Implementation:**
- [`apps/marketing/src/lib/facebook-pixel.ts`](apps/marketing/src/lib/facebook-pixel.ts:129-139) - Pixel only
- [`apps/marketing/src/app/[locale]/checkout/client.tsx`](apps/marketing/src/app/[locale]/checkout/client.tsx:135-145) - Tracked on payment method change

**Result:**
- **Correctly implemented**

---

## Event Coverage Matrix

| Event | Frontend Pixel | Backend CAPI | Dedup Event ID | Status |
|-------|----------------|--------------|----------------|--------|
| PageView | ✅ | ❌ | N/A | ✅ Good |
| ViewContent (product) | ✅ | ❌ | N/A | ✅ Good |
| ViewContent (collection) | ✅ | ❌ | N/A | ✅ Good |
| Search | ✅ | ❌ | N/A | ✅ Good |
| AddToCart | ✅ | ✅ | ❌ MISMATCH | ❌ **DUPLICATE** |
| RemoveFromCart | ✅ | ✅ | ❌ MISMATCH | ❌ **DUPLICATE** |
| AddToWishlist | ✅ | ❌ | N/A | ✅ Good |
| InitiateCheckout | ✅ | ✅ | ❌ MISMATCH | ❌ **DUPLICATE** |
| AddPaymentInfo | ✅ | ❌ | N/A | ✅ Good |
| Purchase (COD) | ✅ | ✅ | ✅ `order_{id}` | ✅ Good |
| Purchase (Ziina) | ❌ | ✅ | N/A | ✅ Good |
| CompleteRegistration | ✅ | ✅ | ✅ `register_{id}` | ✅ Good |
| Lead | ✅ | ✅ | ✅ `lead_{email}_{ts}` | ✅ Good |
| Login | ❌ | ✅ | N/A | ⚠️ Missing pixel |

---

## Root Cause Analysis

### Why Deduplication Fails

The architecture document ([`META_EVENTS_ARCHITECTURE.md`](META_EVENTS_ARCHITECTURE.md:269)) states:

> **Critical rule:** The side that generates the eventId must also share it with the other side. Never use `Date.now()` or `Math.random()` on both sides independently — they will never match.

**However, this rule is violated for:**
1. **AddToCart** - Backend generates `cart_${variantId}_${Date.now()}` but frontend doesn't use eventID
2. **RemoveFromCart** - Backend generates `cart_remove_${variantId}_${Date.now()}` but frontend doesn't use eventID
3. **InitiateCheckout** - Backend generates `checkout_${sessionId}_${Date.now()}` but frontend doesn't use eventID

### Pattern Analysis

**Correct Pattern (Working Events):**
```
Frontend generates eventId → Sends to backend → Backend uses same eventId
OR
Backend generates eventId → Returns to frontend → Frontend uses same eventId
```

**Incorrect Pattern (Broken Events):**
```
Frontend: No eventID (or different)
Backend: Generates own eventID with Date.now()
Result: Two different event IDs → Duplicate events
```

---

## Recommendations

### Priority 1: Fix AddToCart Deduplication (CRITICAL)

**Option A: Frontend Generates Event ID**
```typescript
// In trackQuickAddToCart (analytics.ts)
const eventId = `cart_${variantId}_${Date.now()}`;

// Send to backend
trackEvent("cart-add", {
  productId,
  variantId,
  eventId,  // Add this
  // ... other fields
});

// Send to pixel
fbAddToCart({
  contentId: variantId,
  contentName: productName || productId,
  value: price || 0,
  quantity: quantity || 1,
  eventId,  // Add this parameter
});
```

**Option B: Backend Returns Event ID**
```typescript
// In backend analytics endpoint
const eventId = `cart_${body.variantId}_${Date.now()}`;

await sendMetaEvent({
  eventName: "AddToCart",
  eventId,  // Use this
  // ... other fields
});

return { success: true, eventId };  // Return to frontend
```

### Priority 2: Fix RemoveFromCart Deduplication (CRITICAL)

Apply same pattern as AddToCart.

### Priority 3: Fix InitiateCheckout Deduplication (HIGH)

Apply same pattern as AddToCart.

### Priority 4: Add Login Pixel Event (MEDIUM)

Add `fbLogin()` function and call it from auth context.

---

## Testing Checklist

To verify fixes work correctly:

- [ ] Add item to cart → Events Manager shows **ONE** AddToCart event
- [ ] Remove item from cart → Events Manager shows **ONE** RemoveFromCart event
- [ ] Go to checkout → Events Manager shows **ONE** InitiateCheckout event
- [ ] Complete COD order → Events Manager shows **ONE** Purchase event
- [ ] Complete Ziina order → Events Manager shows **ONE** Purchase event
- [ ] Register new account → Events Manager shows **ONE** CompleteRegistration event
- [ ] Submit contact form → Events Manager shows **ONE** Lead event
- [ ] Login to account → Events Manager shows **ONE** Login event (after fix)
- [ ] Event Match Quality score should be 6+ (fbp + hashed email = good match)

---

## Conclusion

**Overall Assessment: PARTIAL**

**Strengths:**
- Well-documented architecture
- Correct implementation for critical conversion events (Purchase, Lead, CompleteRegistration)
- Proper use of fbp/fbc cookies for matching
- Good error handling and graceful degradation

**Weaknesses:**
- **3 events with duplicate tracking** (AddToCart, RemoveFromCart, InitiateCheckout)
- Missing Login pixel event
- Inconsistent event ID generation patterns

**Impact:**
- Duplicate events will inflate metrics by 2x for affected events
- Ad optimization will be less effective
- Funnel analysis will be inaccurate

**Recommendation:**
Fix the 3 critical deduplication issues before relying on Meta Events data for ad optimization or business decisions.