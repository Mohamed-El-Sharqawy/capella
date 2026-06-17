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
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Pixel]`, ...args);
    }
  } else {
    console.warn("[Pixel] fbq not available, event not sent:", ...args);
  }
}

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

/**
 * Advanced Matching: attach user data to ALL subsequent pixel events so Meta can
 * match events to accounts (raises Event Match Quality). Passes PLAIN values —
 * the Pixel SDK SHA-256 hashes them before transmission (do NOT pre-hash).
 *
 * This is the safe, manual alternative to Automatic Advanced Matching (autoConfig),
 * which we keep disabled because it can auto-fire events that can't be deduped.
 */
export function setPixelUser(user: {
  id?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}): void {
  if (!FB_PIXEL_ID) return;
  const advancedMatching: Record<string, string> = {};
  if (user.email) advancedMatching.em = user.email;
  if (user.phone) advancedMatching.ph = user.phone;
  if (user.firstName) advancedMatching.fn = user.firstName;
  if (user.lastName) advancedMatching.ln = user.lastName;
  if (user.id) advancedMatching.external_id = user.id;
  if (Object.keys(advancedMatching).length === 0) return;

  // Re-init attaches the matching object to every subsequent fbq('track') call.
  fbq("init", FB_PIXEL_ID, advancedMatching);
}

/** Clear Advanced Matching data on logout. */
export function clearPixelUser(): void {
  if (!FB_PIXEL_ID) return;
  fbq("init", FB_PIXEL_ID, {});
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
    currency: params.currency || "AED",
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
  eventId?: string;
}): void {
  const eventData = {
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

/**
 * Track remove from cart (custom event - FB doesn't have standard RemoveFromCart)
 */
export function fbRemoveFromCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
  eventId?: string;
}): void {
  const eventData = {
    content_ids: [params.contentId],
    content_name: params.contentName,
    value: params.value,
    currency: params.currency || "AED",
  };

  if (params.eventId) {
    fbq("trackCustom", "RemoveFromCart", eventData, { eventID: params.eventId });
  } else {
    fbq("trackCustom", "RemoveFromCart", eventData);
  }
}

/**
 * Track initiate checkout
 */
export function fbInitiateCheckout(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
  eventId?: string;
}): void {
  const eventData = {
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
    currency: params.currency || "AED",
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
  const eventData: Record<string, unknown> = {
    content_ids: params.contentIds,
    content_name: params.contentName,
    content_type: "product",
    value: params.value,
    currency: params.currency || "AED",
    num_items: params.numItems,
    order_id: params.orderId,
  };

  if (params.orderId) {
    fbq("track", "Purchase", eventData, {
      eventID: `order_${params.orderId}`,
    });
  } else {
    fbq("track", "Purchase", eventData);
  }
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
    currency: params.currency || "AED",
  });
}

/**
 * Track lead/signup
 */
export function fbLead(params?: {
  value?: number;
  currency?: string;
  eventId?: string;
}): void {
  const eventData = {
    value: params?.value,
    currency: params?.currency || "AED",
  };

  if (params?.eventId) {
    fbq("track", "Lead", eventData, { eventID: params.eventId });
  } else {
    fbq("track", "Lead", eventData);
  }
}

/**
 * Track complete registration
 */
export function fbCompleteRegistration(params?: {
  value?: number;
  currency?: string;
  status?: string;
  eventId?: string;
}): void {
  const eventData = {
    value: params?.value,
    currency: params?.currency || "AED",
    status: params?.status || "registered",
  };

  if (params?.eventId) {
    fbq("track", "CompleteRegistration", eventData, { eventID: params.eventId });
  } else {
    fbq("track", "CompleteRegistration", eventData);
  }
}
