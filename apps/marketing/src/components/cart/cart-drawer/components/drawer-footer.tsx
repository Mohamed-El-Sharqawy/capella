"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { DrawerFooterProps } from "../types";

export function DrawerFooter({ total, itemCount, onClose }: DrawerFooterProps) {
  const t = useTranslations("cartDrawer");

  if (itemCount === 0) return null;

  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex items-center justify-between text-lg font-semibold">
        <span>Total</span>
        <span>LE {total.toLocaleString()} EGP</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/cart"
          onClick={onClose}
          className="py-2.5 border border-black text-black text-center rounded hover:bg-gray-100 transition font-medium"
        >
          {t("viewCart")}
        </Link>
        <Link
          href="/checkout"
          onClick={onClose}
          className="py-2.5 bg-black text-white text-center rounded hover:bg-gray-800 transition font-medium"
        >
          {t("checkout")}
        </Link>
      </div>
    </div>
  );
}
