import { apiPost, ApiError } from "./api-client";
import { getPendingPurchase, clearPendingPurchase } from "./analytics";

/**
 * Storefront stock helpers. The backend is the source of truth (it re-checks
 * and atomically decrements stock when an order is placed); these keep the UI
 * honest so customers can't add or buy something that's sold out.
 */

type StockLike = { stock?: number | null; isActive?: boolean | null } | null | undefined;

/** Quantity that can be bought right now (0 when inactive or missing). */
export function getAvailableStock(variant: StockLike): number {
  if (!variant || variant.isActive === false) return 0;
  return Math.max(0, variant.stock ?? 0);
}

export function isVariantInStock(variant: StockLike): boolean {
  return getAvailableStock(variant) > 0;
}

export interface StockIssue {
  variantId: string;
  requested: number;
  available: number;
}

/** Live available quantity per variant id, from the backend. */
export async function fetchAvailability(variantIds: string[]): Promise<Map<string, number>> {
  const ids = [...new Set(variantIds)];
  if (ids.length === 0) return new Map();
  const res = await apiPost<{ data: { variantId: string; available: number }[] }>(
    "/api/products/availability",
    { variantIds: ids },
  );
  return new Map(res.data.map((r) => [r.variantId, r.available]));
}

/** Returns the stock issues if `error` is the backend's OUT_OF_STOCK (409) response. */
export function getOutOfStockIssues(error: unknown): StockIssue[] | null {
  if (error instanceof ApiError && error.status === 409 && error.data?.code === "OUT_OF_STOCK") {
    return (error.data.items ?? []) as StockIssue[];
  }
  return null;
}

/**
 * Stock for an online order is held while the customer is on the payment
 * page. If they come back to the store without paying (cancel link or back
 * button), release that hold right away so the units, including the ones in
 * their own cart, show as available again. No-op when there's no unpaid
 * attempt in this tab; the backend ignores orders that were already paid.
 */
export async function releaseAbandonedCheckout(): Promise<void> {
  const pending = getPendingPurchase();
  if (!pending?.orderId) return;
  try {
    await apiPost("/api/payments/release", { orderId: pending.orderId });
    clearPendingPurchase();
  } catch (err) {
    // Non-fatal: the backend also releases unpaid holds after a timeout.
    console.error("Failed to release abandoned checkout:", err);
  }
}

type VariantWithColor = { stock?: number | null; isActive?: boolean | null; color?: { id: string } | null };

/** First purchasable variant, falling back to the first one (all sold out). */
export function firstInStockVariant<T extends VariantWithColor>(variants: T[] | undefined | null): T | null {
  return variants?.find(isVariantInStock) ?? variants?.[0] ?? null;
}

/** A colour is sold out when none of its variants can be bought. */
export function isColorSoldOut(variants: VariantWithColor[] | undefined | null, colorId: string): boolean {
  return !variants?.some((v) => v.color?.id === colorId && isVariantInStock(v));
}
