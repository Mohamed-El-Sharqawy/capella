/**
 * Analytics tracking utilities for the marketing app
 * Sends events to the backend for storage and analysis
 * Also triggers Facebook Pixel events
 */

import {
  fbViewContent,
  fbViewCategory,
  fbAddToCart,
  fbRemoveFromCart,
  fbSearch,
  fbAddToWishlist,
  fbInitiateCheckout,
  fbPurchase,
} from "./facebook-pixel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Generate or retrieve session ID for anonymous tracking
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

// Fire and forget - don't block the UI
async function trackEvent(endpoint: string, data: Record<string, unknown>): Promise<void> {
  try {
    const sessionId = getSessionId();
    
    await fetch(`${API_URL}/api/analytics/track/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify(data),
      // Use keepalive to ensure request completes even if page navigates
      keepalive: true,
    });
  } catch {
    // Silently fail - analytics should never break the app
    console.debug("[Analytics] Failed to track event:", endpoint);
  }
}

/**
 * Track product page view
 */
export function trackProductView(
  productId: string, 
  productSlug?: string,
  productName?: string,
  price?: number
): void {
  trackEvent("product-view", { productId, productSlug });
  
  // Facebook Pixel
  fbViewContent({
    contentId: productId,
    contentName: productName || productSlug || productId,
    contentType: "product",
    value: price,
  });
}

/**
 * Track collection page view
 */
export function trackCollectionView(
  collectionId: string, 
  collectionSlug?: string,
  collectionName?: string
): void {
  trackEvent("collection-view", { collectionId, collectionSlug });
  
  // Facebook Pixel
  fbViewCategory({
    contentId: collectionId,
    contentName: collectionName || collectionSlug || collectionId,
  });
}

/**
 * Track search query
 */
export function trackSearch(query: string, resultsCount: number, productIds?: string[]): void {
  trackEvent("search", { query, resultsCount });
  
  // Facebook Pixel
  fbSearch({
    searchString: query,
    contentIds: productIds,
  });
}

/**
 * Track quick add to cart from product card
 */
export function trackQuickAddToCart(
  productId: string, 
  variantId: string,
  productName?: string,
  price?: number,
  quantity?: number
): void {
  trackEvent("cart-add", { productId, variantId, source: "quick_add" });
  
  // Facebook Pixel
  fbAddToCart({
    contentId: variantId,
    contentName: productName || productId,
    value: price || 0,
    quantity: quantity || 1,
  });
}

/**
 * Track remove from cart
 */
export function trackCartRemove(
  productId: string, 
  variantId: string,
  productName?: string,
  price?: number
): void {
  trackEvent("cart-remove", { productId, variantId });
  
  // Facebook Pixel
  fbRemoveFromCart({
    contentId: variantId,
    contentName: productName || productId,
    value: price || 0,
  });
}

/**
 * Track favourite add/remove
 */
export function trackFavouriteToggle(productId: string, action: "add" | "remove"): void {
  trackEvent(`favourite-${action}`, { productId });
}

/**
 * Track wishlist add/remove
 */
export function trackWishlistToggle(
  productId: string, 
  action: "add" | "remove",
  productName?: string,
  price?: number
): void {
  trackEvent(`wishlist-${action}`, { productId });
  
  // Facebook Pixel - only track add (no standard remove event)
  if (action === "add") {
    fbAddToWishlist({
      contentId: productId,
      contentName: productName || productId,
      value: price,
    });
  }
}

/**
 * Track checkout page view
 */
export function trackCheckoutView(
  cartItemCount: number, 
  cartTotal: number,
  variantIds?: string[]
): void {
  trackEvent("checkout-view", { cartItemCount, cartTotal });
  
  // Facebook Pixel
  fbInitiateCheckout({
    contentIds: variantIds || [],
    value: cartTotal,
    numItems: cartItemCount,
  });
}

/**
 * Track checkout step progression
 */
export function trackCheckoutStep(step: "shipping" | "payment" | "review", data?: Record<string, unknown>): void {
  trackEvent("checkout-step", { step, ...data });
}

/**
 * Track checkout abandonment (user leaves checkout)
 */
export function trackCheckoutAbandon(step: string, cartItemCount: number, cartTotal: number): void {
  trackEvent("checkout-abandon", { step, cartItemCount, cartTotal });
}

/**
 * Track order completion
 */
export function trackOrderComplete(
  orderId: string, 
  total: number, 
  itemCount: number,
  variantIds?: string[]
): void {
  trackEvent("order-complete", { orderId, total, itemCount });
  
  // Facebook Pixel
  fbPurchase({
    contentIds: variantIds || [],
    value: total,
    numItems: itemCount,
    orderId,
  });
}
