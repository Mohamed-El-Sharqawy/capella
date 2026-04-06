"use client";

import { Truck, CreditCard, Smartphone, Banknote, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export function PaymentMethodSection() {
  const t = useTranslations("checkout");

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">
          3
        </span>
        {t("paymentMethod")}
      </h2>

      {/* COD - Active */}
      <div className="border-2 border-black rounded-lg p-4 mb-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-black rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-full" />
          </div>
          <Banknote className="h-5 w-5" />
          <div className="flex-1">
            <p className="font-medium">{t("cod")}</p>
            <p className="text-sm text-muted-foreground">{t("codDesc")}</p>
          </div>
          <Truck className="h-5 w-5 text-green-600" />
        </div>
      </div>

      {/* Coming Soon Payment Methods */}
      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600">{t("comingSoon")}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Visa */}
          <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-gray-200 opacity-60">
            <div className="w-12 h-8 bg-linear-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
              VISA
            </div>
            <span className="text-xs text-muted-foreground">Visa</span>
          </div>

          {/* Mastercard */}
          <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-gray-200 opacity-60">
            <div className="w-12 h-8 flex items-center justify-center">
              <div className="w-5 h-5 bg-red-500 rounded-full -mr-2" />
              <div className="w-5 h-5 bg-yellow-500 rounded-full opacity-80" />
            </div>
            <span className="text-xs text-muted-foreground">Mastercard</span>
          </div>

          {/* Apple Pay */}
          <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-gray-200 opacity-60">
            <div className="w-12 h-8 bg-black rounded flex items-center justify-center text-white text-xs font-medium">
              Pay
            </div>
            <span className="text-xs text-muted-foreground">Apple Pay</span>
          </div>

          {/* Vodafone Cash */}
          <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-gray-200 opacity-60">
            <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Vodafone Cash</span>
          </div>

          {/* Installments */}
          <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-gray-200 opacity-60">
            <div className="w-12 h-8 bg-linear-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">{t("installments")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
