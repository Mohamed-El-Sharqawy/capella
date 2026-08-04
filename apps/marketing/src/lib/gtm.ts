/**
 * Client-side Google Tag Manager (GTM) helpers + dataLayer bridge.
 * Parallel-run safe: no-ops entirely while NEXT_PUBLIC_TRACKING_MODE === "legacy".
 *
 * Every push is GA4-ecommerce shaped so the sGTM GA4 client parses it natively,
 * and carries the SAME event_id the Meta Pixel + backend CAPI use, so dedup
 * survives the move to server-side GTM.
 */

import { CURRENCY } from "@ecommerce/shared-utils";
import { getFbp, getFbc } from "./meta-cookies";

export type TrackingMode = "legacy" | "parallel" | "sgtm_meta" | "full";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

const TRACKING_MODE = (process.env.NEXT_PUBLIC_TRACKING_MODE || "legacy") as TrackingMode;

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
export const SGTM_URL = process.env.NEXT_PUBLIC_SGTM_URL;

export function isGtmEnabled(): boolean {
  return Boolean(GTM_ID) && TRACKING_MODE !== "legacy";
}

export function getTrackingMode(): TrackingMode {
  return TRACKING_MODE;
}

/** GA4 ecommerce item shape. */
export interface GtmItem {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
}

/** GA4 ecommerce payload. */
export interface GtmEcommerce {
  currency?: string;
  value?: number;
  transaction_id?: string;
  items?: GtmItem[];
}

export interface GtmEvent {
  event: string;
  event_id?: string;
  ecommerce?: GtmEcommerce | null;
  [key: string]: unknown;
}

/**
 * Push an event to the GTM dataLayer. No-ops on the server, when GTM is disabled
 * (legacy mode), or when dataLayer is not ready. Resets the ecommerce object first
 * so stale items from a previous event do not carry over (GA4 requirement).
 *
 * Privacy: never push raw PII here. Only opaque ids / hashed values are allowed.
 * Server-side hashing of user_data happens in sGTM, not in the browser.
 */
export function pushToDataLayer(event: GtmEvent): void {
  if (typeof window === "undefined") return;
  if (!isGtmEnabled()) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(event);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[dataLayer] ${event.event}`, event);
  }
}

/** Browser-session identifiers for cross-channel matching, read once per push. */
function sessionUserData(): Record<string, string | undefined> {
  return { fbp: getFbp(), fbc: getFbc() };
}

/** Standard GA4 `view_item` (product detail view). */
/** Standard GA4 `view_item`. Shares event_id with the Meta Pixel for dedup. */
export function gtmViewItem(params: {
  itemId: string;
  itemName?: string;
  value?: number;
  eventId?: string;
}): void {
  pushToDataLayer({
    event: "view_item",
    event_id: params.eventId,
    ecommerce: {
      currency: CURRENCY,
      value: params.value,
      items: [{ item_id: params.itemId, item_name: params.itemName, price: params.value }],
    },
  });
}

/** Standard GA4 `view_item_list`. Shares event_id with the Meta Pixel for dedup. */
export function gtmViewItemList(params: { itemId: string; itemName?: string; eventId?: string }): void {
  pushToDataLayer({
    event: "view_item_list",
    event_id: params.eventId,
    ecommerce: {
      currency: CURRENCY,
      items: [{ item_id: params.itemId, item_name: params.itemName }],
    },
  });
}

/** Standard GA4 `search`. Shares event_id with the Meta Pixel for dedup. */
export function gtmSearch(params: { searchString: string; items?: GtmItem[]; eventId?: string }): void {
  pushToDataLayer({
    event: "search",
    event_id: params.eventId,
    search_term: params.searchString,
    ecommerce: params.items ? { currency: CURRENCY, items: params.items } : null,
  });
}

/** Standard GA4 `add_to_cart`. Shares event_id with the Meta Pixel + backend CAPI. */
export function gtmAddToCart(params: {
  eventId?: string;
  itemId: string;
  itemName?: string;
  value?: number;
  quantity?: number;
}): void {
  const qty = params.quantity || 1;
  pushToDataLayer({
    event: "add_to_cart",
    event_id: params.eventId,
    ...sessionUserData(),
    ecommerce: {
      currency: CURRENCY,
      value: (params.value || 0) * qty,
      items: [{ item_id: params.itemId, item_name: params.itemName, price: params.value, quantity: qty }],
    },
  });
}

/** Custom GA4 `remove_from_cart`. */
export function gtmRemoveFromCart(params: {
  eventId?: string;
  itemId: string;
  itemName?: string;
  value?: number;
}): void {
  pushToDataLayer({
    event: "remove_from_cart",
    event_id: params.eventId,
    ...sessionUserData(),
    ecommerce: {
      currency: CURRENCY,
      value: params.value,
      items: [{ item_id: params.itemId, item_name: params.itemName, price: params.value }],
    },
  });
}

/** Standard GA4 `add_to_wishlist`. Shares event_id with the Meta Pixel for dedup. */
export function gtmAddToWishlist(params: {
  itemId: string;
  itemName?: string;
  value?: number;
  eventId?: string;
}): void {
  pushToDataLayer({
    event: "add_to_wishlist",
    event_id: params.eventId,
    ecommerce: {
      currency: CURRENCY,
      value: params.value,
      items: [{ item_id: params.itemId, item_name: params.itemName, price: params.value }],
    },
  });
}

/** Standard GA4 `begin_checkout`. Shares event_id with the Meta Pixel + backend CAPI. */
export function gtmBeginCheckout(params: {
  eventId?: string;
  value: number;
  items: GtmItem[];
}): void {
  pushToDataLayer({
    event: "begin_checkout",
    event_id: params.eventId,
    ...sessionUserData(),
    ecommerce: {
      currency: CURRENCY,
      value: params.value,
      items: params.items,
    },
  });
}

/** Standard GA4 `add_payment_info`. Shares event_id with the Meta Pixel for dedup. */
export function gtmAddPaymentInfo(params: { value: number; items: GtmItem[]; eventId?: string }): void {
  pushToDataLayer({
    event: "add_payment_info",
    event_id: params.eventId,
    ecommerce: {
      currency: CURRENCY,
      value: params.value,
      items: params.items,
    },
  });
}

/** Standard GA4 `purchase`. transaction_id = order id (same id Meta dedupes on). */
export function gtmPurchase(params: {
  orderId: string;
  value: number;
  items: GtmItem[];
}): void {
  pushToDataLayer({
    event: "purchase",
    event_id: `order_${params.orderId}`,
    ...sessionUserData(),
    ecommerce: {
      currency: CURRENCY,
      transaction_id: params.orderId,
      value: params.value,
      items: params.items,
    },
  });
}

/** Standard GA4 `generate_lead` (contact form). Shares event_id with backend CAPI. */
export function gtmGenerateLead(params: { eventId: string; value?: number }): void {
  pushToDataLayer({
    event: "generate_lead",
    event_id: params.eventId,
    ...sessionUserData(),
    ecommerce: {
      currency: CURRENCY,
      value: params.value,
    },
  });
}

/** Standard GA4 `sign_up` (registration). Shares event_id with backend CAPI. */
export function gtmSignUp(params: { eventId?: string }): void {
  pushToDataLayer({
    event: "sign_up",
    event_id: params.eventId,
    ...sessionUserData(),
    method: "email",
  });
}

/** Custom GA4 `checkout_abandon` (audience-only, not forwarded to Meta). */
export function gtmCheckoutAbandon(params: { step: string; value: number; items: GtmItem[] }): void {
  pushToDataLayer({
    event: "checkout_abandon",
    checkout_step: params.step,
    ecommerce: {
      currency: CURRENCY,
      value: params.value,
      items: params.items,
    },
  });
}
