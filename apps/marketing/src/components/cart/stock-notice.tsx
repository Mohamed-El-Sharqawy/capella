"use client";

import { useTranslations } from "next-intl";
type StockedItem = { stock?: number; quantity: number };

/** Show "Only N left" at or below this many units. */
const LOW_STOCK_THRESHOLD = 3;

/** Per-line stock hint for cart rows: "Sold out" or "Only N left". */
export function CartItemStockNotice({ item, className = "" }: { item: StockedItem; className?: string }) {
  const t = useTranslations("stock");
  if (item.stock === undefined) return null;
  if (item.stock <= 0) {
    return (
      <p className={`text-xs font-semibold text-red-600 ${className}`} role="status">
        {t("soldOut")}
      </p>
    );
  }
  if (item.stock <= LOW_STOCK_THRESHOLD) {
    return (
      <p className={`text-xs text-amber-700 ${className}`} role="status">
        {t("onlyLeft", { count: item.stock })}
      </p>
    );
  }
  return null;
}

/** True when the "+" button should be disabled for this line. */
export function isAtStockLimit(item: StockedItem): boolean {
  return item.stock !== undefined && item.quantity >= item.stock;
}

/** Banner explaining why checkout is blocked. */
export function CheckoutBlockedNotice({ className = "" }: { className?: string }) {
  const t = useTranslations("stock");
  return (
    <p className={`text-xs text-red-600 ${className}`} role="alert">
      {t("removeUnavailable")}
    </p>
  );
}
