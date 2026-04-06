/**
 * Facebook Pixel tracking utilities
 * Standard events: https://developers.facebook.com/docs/meta-pixel/reference
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

// Check if Facebook Pixel is loaded
function isFbqAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

// Safe wrapper for fbq calls
function fbq(...args: unknown[]): void {
  if (isFbqAvailable()) {
    window.fbq(...args);
  }
}

/**
 * Track page view - called automatically by the pixel, but can be called manually for SPAs
 */
export function fbPageView(): void {
  fbq("track", "PageView");
}

/**
 * Track product view (ViewContent event)
 */
export function fbViewContent(params: {
  contentId: string;
  contentName: string;
  contentType: "product" | "product_group";
  value?: number;
  currency?: string;
}): void {
  fbq("track", "ViewContent", {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: params.contentType,
    value: params.value,
    currency: params.currency || "EGP",
  });
}

/**
 * Track collection/category view
 */
export function fbViewCategory(params: {
  contentId: string;
  contentName: string;
}): void {
  fbq("track", "ViewContent", {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: "product_group",
  });
}

/**
 * Track add to cart
 */
export function fbAddToCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
  quantity?: number;
}): void {
  fbq("track", "AddToCart", {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: "product",
    value: params.value,
    currency: params.currency || "EGP",
    contents: [
      {
        id: params.contentId,
        quantity: params.quantity || 1,
      },
    ],
  });
}

/**
 * Track remove from cart (custom event - FB doesn't have standard RemoveFromCart)
 */
export function fbRemoveFromCart(params: {
  contentId: string;
  contentName: string;
  value: number;
}): void {
  fbq("trackCustom", "RemoveFromCart", {
    content_ids: [params.contentId],
    content_name: params.contentName,
    value: params.value,
    currency: "EGP",
  });
}

/**
 * Track initiate checkout
 */
export function fbInitiateCheckout(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
}): void {
  fbq("track", "InitiateCheckout", {
    content_ids: params.contentIds,
    value: params.value,
    currency: params.currency || "EGP",
    num_items: params.numItems,
  });
}

/**
 * Track add payment info
 */
export function fbAddPaymentInfo(params: {
  contentIds: string[];
  value: number;
  currency?: string;
}): void {
  fbq("track", "AddPaymentInfo", {
    content_ids: params.contentIds,
    value: params.value,
    currency: params.currency || "EGP",
  });
}

/**
 * Track purchase/order completion
 */
export function fbPurchase(params: {
  contentIds: string[];
  contentName?: string;
  value: number;
  currency?: string;
  numItems: number;
  orderId?: string;
}): void {
  fbq("track", "Purchase", {
    content_ids: params.contentIds,
    content_name: params.contentName,
    content_type: "product",
    value: params.value,
    currency: params.currency || "EGP",
    num_items: params.numItems,
    order_id: params.orderId,
  });
}

/**
 * Track search
 */
export function fbSearch(params: {
  searchString: string;
  contentIds?: string[];
}): void {
  fbq("track", "Search", {
    search_string: params.searchString,
    content_ids: params.contentIds,
  });
}

/**
 * Track add to wishlist
 */
export function fbAddToWishlist(params: {
  contentId: string;
  contentName: string;
  value?: number;
  currency?: string;
}): void {
  fbq("track", "AddToWishlist", {
    content_ids: [params.contentId],
    content_name: params.contentName,
    value: params.value,
    currency: params.currency || "EGP",
  });
}

/**
 * Track lead/signup
 */
export function fbLead(params?: {
  value?: number;
  currency?: string;
}): void {
  fbq("track", "Lead", {
    value: params?.value,
    currency: params?.currency || "EGP",
  });
}

/**
 * Track complete registration
 */
export function fbCompleteRegistration(params?: {
  value?: number;
  currency?: string;
  status?: string;
}): void {
  fbq("track", "CompleteRegistration", {
    value: params?.value,
    currency: params?.currency || "EGP",
    status: params?.status || "registered",
  });
}
