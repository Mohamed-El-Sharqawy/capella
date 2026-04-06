"use client";

import { CreditCard, Shield } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { CART_ROUTES } from "../constants";
import type { OrderSummaryProps } from "../types";

export function OrderSummary({ total }: OrderSummaryProps) {
  const t = useTranslations("cart");

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground">{t("subtotal")}</span>
        <span className="text-xl font-bold">LE {total.toLocaleString()} EGP</span>
      </div>

      <Link
        href={CART_ROUTES.CHECKOUT}
        className="w-full py-3 bg-black text-white text-center font-medium rounded flex items-center justify-center gap-2 hover:bg-gray-800 transition"
      >
        <CreditCard className="h-4 w-4" />
        {t("checkout")}
      </Link>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        {t("safeCheckout")}
      </div>

      {/* Payment Icons */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="w-10 h-6 bg-white border rounded flex items-center justify-center text-xs font-bold text-blue-600">
          VISA
        </div>
        <div className="w-10 h-6 bg-white border rounded flex items-center justify-center">
          <div className="w-4 h-4 bg-red-500 rounded-full -mr-1" />
          <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-80" />
        </div>
        <div className="w-10 h-6 bg-white border rounded flex items-center justify-center text-xs font-bold text-orange-500">
          fawry
        </div>
        <div className="w-10 h-6 bg-white border rounded flex items-center justify-center text-xs font-bold">
          valu
        </div>
        <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-xs font-bold text-white">
          Pay
        </div>
      </div>
    </div>
  );
}
