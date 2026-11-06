"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { DrawerFooterProps } from "../types";
import { useCart } from "@/contexts/cart-context";
import { CheckoutBlockedNotice } from "@/components/cart/stock-notice";

export function DrawerFooter({ total, itemCount, onClose }: DrawerFooterProps) {
  const t = useTranslations("cartDrawer");
  const { hasUnavailableItems } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex items-center justify-between text-lg font-semibold">
        <span>Total</span>
        <span>AED {total.toLocaleString()}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/cart"
          onClick={onClose}
          className="py-2.5 border border-black text-black text-center rounded hover:bg-gray-100 transition font-medium"
        >
          {t("viewCart")}
        </Link>
        {hasUnavailableItems ? (
          <button
            type="button"
            disabled
            className="py-2.5 bg-neutral-300 text-neutral-600 text-center rounded font-medium cursor-not-allowed"
          >
            {t("checkout")}
          </button>
        ) : (
          <Link
            href="/checkout"
            onClick={onClose}
            className="py-2.5 bg-black text-white text-center rounded hover:bg-gray-800 transition font-medium"
          >
            {t("checkout")}
          </Link>
        )}
      </div>
      {hasUnavailableItems && <CheckoutBlockedNotice />}
    </div>
  );
}
