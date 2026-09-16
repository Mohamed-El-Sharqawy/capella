/**
 * TikTok Pixel tracking utilities
 * Standard web events: https://business-api.tiktok.com/portal/docs?id=1771100803824641
 */

import { CURRENCY, normalizeEmail, normalizePhone } from "@ecommerce/shared-utils";

declare global {
  interface Window {
    ttq?: {
      track: (event: string, data?: Record<string, unknown>, opts?: Record<string, unknown>) => void;
      page: () => void;
      identify: (data: Record<string, string>) => void;
    };
  }
}

// Check if TikTok Pixel is loaded
function isTtqAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.ttq?.track === "function";
}

// Safe wrapper for ttq calls
function ttq(
  method: "track" | "page",
  event?: string,
  data?: Record<string, unknown>,
  opts?: Record<string, unknown>,
): void {
  if (isTtqAvailable() && window.ttq) {
    if (method === "page") {
      window.ttq.page();
    } else if (event) {
      window.ttq.track(event, data, opts);
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(`[TikTok]`, event ?? method, data ?? "");
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.warn("[TikTok] ttq not available, event not sent:", event ?? method);
  }
}

/**
 * Track page view - fired automatically on load, called manually for SPA
 * route changes from the PageViewTracker.
 */
export function ttPageView(): void {
  ttq("page");
}

/**
 * SHA-256 hex digest (lowercase) - the exact format TikTok identify expects.
 * Web Crypto is async, so callers fire-and-forget; the pixel's bootstrap
 * queue buffers the identify call if the SDK has not loaded yet.
 */
async function sha256Hex(value: string): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Advanced Matching for TikTok (mirrors setPixelUser for Meta). Attaches user
 * data to all subsequent TikTok events so they can be matched to accounts.
 *
 * Match-quality contract:
 * - email/phone are normalized with the SAME shared-utils normalizers the
 *   backend CAPI uses, then SHA-256 hashed client-side. ttq.identify expects
 *   PRE-hashed values (unlike Meta's SDK, which hashes for you), and browser
 *   + server hashes must be byte-identical or matching silently degrades.
 * - phone must be country-code digits (971...) — normalizePhone already
 *   produces that.
 * - external_id stays RAW and must match the server Events API's external_id.
 */
export async function ttIdentify(user: {
  id?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  if (typeof window === "undefined" || typeof window.ttq?.identify !== "function") return;

  const data: Record<string, string> = {};
  try {
    if (user.email) {
      const hash = await sha256Hex(normalizeEmail(user.email));
      if (hash) data.email = hash;
    }
    if (user.phone) {
      const ph = normalizePhone(user.phone);
      const hash = ph ? await sha256Hex(ph) : null;
      if (hash) data.phone_number = hash;
    }
  } catch {
    // crypto.subtle unavailable (non-secure context) — non-fatal, skip identify.
    return;
  }
  if (user.id) data.external_id = user.id;
  if (Object.keys(data).length === 0) return;

  window.ttq.identify(data);
}

/**
 * Best-effort reset on logout. TikTok has no documented un-identify; an empty
 * identify is harmless and the next login's ttIdentify overwrites all fields.
 */
export function ttClearIdentify(): void {
  if (typeof window === "undefined" || typeof window.ttq?.identify !== "function") return;
  window.ttq.identify({});
}

/**
 * Track product/collection view (ViewContent event)
 */
export function ttViewContent(params: {
  contentId: string;
  contentName: string;
  contentType: "product" | "product_group";
  price?: number;
  quantity?: number;
  value?: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "ViewContent",
    {
      content_id: params.contentId,
      content_name: params.contentName,
      content_type: params.contentType,
      price: params.price,
      quantity: params.quantity,
      value: params.value ?? params.price,
      currency: params.currency || CURRENCY,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track add to cart
 */
export function ttAddToCart(params: {
  contentId: string;
  contentName: string;
  price: number;
  quantity?: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "AddToCart",
    {
      content_id: params.contentId,
      content_name: params.contentName,
      content_type: "product",
      quantity: params.quantity || 1,
      price: params.price,
      value: params.price * (params.quantity || 1),
      currency: params.currency || CURRENCY,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track initiate checkout
 */
export function ttInitiateCheckout(params: {
  contentIds: string[];
  value: number;
  numItems: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "InitiateCheckout",
    {
      content_id: params.contentIds,
      content_type: "product",
      quantity: params.numItems,
      value: params.value,
      currency: params.currency || CURRENCY,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track add payment info
 */
export function ttAddPaymentInfo(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "AddPaymentInfo",
    {
      content_id: params.contentIds,
      content_type: "product",
      value: params.value,
      currency: params.currency || CURRENCY,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track order placed (pre-payment confirmation)
 */
export function ttPlaceAnOrder(params: {
  contentIds: string[];
  value: number;
  numItems: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "PlaceAnOrder",
    {
      content_id: params.contentIds,
      content_type: "product",
      quantity: params.numItems,
      value: params.value,
      currency: params.currency || CURRENCY,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track completed purchase - the TikTok equivalent of Meta's Purchase event.
 * eventId should be shared with the Events API payload for dedup.
 */
export function ttCompletePayment(params: {
  contentIds: string[];
  value: number;
  numItems: number;
  currency?: string;
  orderId?: string;
}): void {
  ttq(
    "track",
    "CompletePayment",
    {
      content_id: params.contentIds,
      content_type: "product",
      quantity: params.numItems,
      value: params.value,
      currency: params.currency || CURRENCY,
    },
    params.orderId ? { event_id: `order_${params.orderId}` } : undefined,
  );
}

/**
 * Track search
 */
export function ttSearch(params: {
  searchString: string;
  contentIds?: string[];
  eventId?: string;
}): void {
  ttq(
    "track",
    "Search",
    {
      search_string: params.searchString,
      content_id: params.contentIds,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track remove from cart (custom event - TikTok has no standard RemoveFromCart).
 * Keeps the same event_id contract as Meta so the future server Events API
 * call can dedup against it.
 */
export function ttRemoveFromCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "RemoveFromCart",
    {
      content_id: params.contentId,
      content_name: params.contentName,
      content_type: "product",
      value: params.value,
      currency: params.currency || CURRENCY,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track add to wishlist
 */
export function ttAddToWishlist(params: {
  contentId: string;
  contentName: string;
  price?: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "AddToWishlist",
    {
      content_id: params.contentId,
      content_name: params.contentName,
      content_type: "product",
      price: params.price,
      value: params.price,
      currency: params.currency || CURRENCY,
    },
    params.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track lead form submission
 */
export function ttSubmitForm(params?: {
  value?: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "SubmitForm",
    {
      value: params?.value,
      currency: params?.currency || CURRENCY,
    },
    params?.eventId ? { event_id: params.eventId } : undefined,
  );
}

/**
 * Track completed registration. eventId must be the server-generated
 * regEventId so the Events API event dedups against this browser event.
 */
export function ttCompleteRegistration(params?: {
  value?: number;
  currency?: string;
  eventId?: string;
}): void {
  ttq(
    "track",
    "CompleteRegistration",
    {
      value: params?.value,
      currency: params?.currency || CURRENCY,
    },
    params?.eventId ? { event_id: params.eventId } : undefined,
  );
}
