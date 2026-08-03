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
import { getFbp, getFbc } from "./meta-cookies";
import { capiHeaders } from "./capi-headers";
import { toContentId } from "@ecommerce/shared-utils";
import {
  gtmViewItem,
  gtmViewItemList,
  gtmSearch,
  gtmAddToCart,
  gtmRemoveFromCart,
  gtmAddToWishlist,
  gtmBeginCheckout,
  gtmPurchase,
  gtmCheckoutAbandon,
} from "./gtm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const trackedViews = new Set<string>();

function dedup(key: string): boolean {
  if (trackedViews.has(key)) return false;
  trackedViews.add(key);
  return true;
}

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
        ...capiHeaders(),
      },
      body: JSON.stringify(data),
      // Use keepalive to ensure request completes even if page navigates
      keepalive: true,
      credentials: "include",
      referrerPolicy: "no-referrer-when-downgrade",
    });
  } catch {
    // Silently fail - analytics should never break the app
    console.debug("[Analytics] Failed to track event:", endpoint);
  }
}

// Generate a stable event id for deduplication between Pixel and CAPI.
// Generated client-side and forwarded to the server so both channels share it.
function genEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
  if (!dedup(`product_${productId}`)) return;
  trackEvent("product-view", { productId, productSlug });

  // Catalog feed's `item_group_id` is the raw product.id — match it via
  // content_type: 'product_group' so Meta can correlate ViewContent with the PDP.
  fbViewContent({
    contentId: productId,
    contentName: productName || productSlug || productId,
    contentType: "product_group",
    value: price,
  });

  gtmViewItem({
    itemId: productId,
    itemName: productName || productSlug,
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
  if (!dedup(`collection_${collectionId}`)) return;
  trackEvent("collection-view", { collectionId, collectionSlug });
  
  // Facebook Pixel
  fbViewCategory({
    contentId: collectionId,
    contentName: collectionName || collectionSlug || collectionId,
  });

  gtmViewItemList({
    itemId: collectionId,
    itemName: collectionName || collectionSlug,
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

  gtmSearch({
    searchString: query,
    items: productIds?.map((id) => ({ item_id: id })),
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
  quantity?: number,
  sku?: string | null
): void {
  const eventId = genEventId();
  // Format the catalog-correlatable content_id once here; downstream Pixel + CAPI
  // share the same pre-formatted string so Meta DPA can match this event.
  const contentId = toContentId({ id: variantId, sku });
  trackEvent("cart-add", {
    productId,
    variantId,
    source: "quick_add",
    fbp: getFbp(),
    fbc: getFbc(),
    value: price,
    contentIds: [contentId],
    contentName: productName || productId,
    eventId,
  });

  // Facebook Pixel
  fbAddToCart({
    contentId,
    contentName: productName || productId,
    value: price || 0,
    quantity: quantity || 1,
    eventId,
  });

  gtmAddToCart({
    eventId,
    itemId: contentId,
    itemName: productName || productId,
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
  price?: number,
  sku?: string | null
): void {
  const eventId = genEventId();
  const contentId = toContentId({ id: variantId, sku });
  trackEvent("cart-remove", {
    productId,
    variantId,
    fbp: getFbp(),
    fbc: getFbc(),
    value: price,
    contentIds: [contentId],
    contentName: productName || productId,
    eventId,
  });

  // Facebook Pixel
  fbRemoveFromCart({
    contentId,
    contentName: productName || productId,
    value: price || 0,
    eventId,
  });

  gtmRemoveFromCart({
    eventId,
    itemId: contentId,
    itemName: productName || productId,
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

    gtmAddToWishlist({
      itemId: productId,
      itemName: productName || productId,
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
  items?: { variantId: string; sku?: string | null }[]
): void {
  const eventId = genEventId();
  const contentIds = (items || []).map((i) => toContentId({ id: i.variantId, sku: i.sku }));
  trackEvent("checkout-view", {
    cartItemCount,
    cartTotal,
    fbp: getFbp(),
    fbc: getFbc(),
    contentIds,
    eventId,
  });

  // Facebook Pixel
  fbInitiateCheckout({
    contentIds,
    value: cartTotal,
    numItems: cartItemCount,
    eventId,
  });

  gtmBeginCheckout({
    eventId,
    value: cartTotal,
    items: (items || []).map((i) => ({ item_id: toContentId({ id: i.variantId, sku: i.sku }) })),
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

  gtmCheckoutAbandon({
    step,
    value: cartTotal,
    items: [],
  });
}

/**
 * Track order completion
 */
export function trackOrderComplete(
  orderId: string,
  total: number,
  itemCount: number,
  items?: { variantId: string; sku?: string | null }[]
): void {
  trackEvent("order-complete", { orderId, total, itemCount });

  const gtmItems = (items || []).map((i) => ({ item_id: toContentId({ id: i.variantId, sku: i.sku }) }));

  // Facebook Pixel
  fbPurchase({
    contentIds: gtmItems.map((i) => i.item_id),
    value: total,
    numItems: itemCount,
    orderId,
  });

  gtmPurchase({
    orderId,
    value: total,
    items: gtmItems,
  });
}

export interface PendingPurchase {
  orderId: string;
  total: number;
  itemCount: number;
  items: { variantId: string; sku?: string | null }[];
}

const PENDING_PURCHASE_KEY = "pending_purchase";

/**
 * Persist the order snapshot before redirecting to a hosted payment provider
 * (Ziina/Tabby/Tamara). sessionStorage survives same-origin redirects, so the
 * success page can recover the value/items after the customer returns — the
 * cart context is unreachable there and the provider's URL carries no totals.
 */
export function savePendingPurchase(p: PendingPurchase): void {
  try {
    sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(p));
  } catch {
    // sessionStorage may be unavailable (private mode) — non-fatal.
  }
}

export function getPendingPurchase(): PendingPurchase | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPurchase;
  } catch {
    return null;
  }
}

export function clearPendingPurchase(): void {
  try {
    sessionStorage.removeItem(PENDING_PURCHASE_KEY);
  } catch {
    // no-op
  }
}
