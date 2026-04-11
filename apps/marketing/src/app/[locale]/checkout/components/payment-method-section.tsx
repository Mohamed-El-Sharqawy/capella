import type { CheckoutFormState } from "../types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Banknote, CreditCard, Truck, Clock, Smartphone } from "lucide-react";

interface PaymentMethodSectionProps {
  formState: CheckoutFormState;
  onUpdateField: (field: keyof CheckoutFormState, value: string) => void;
}

export function PaymentMethodSection({ formState, onUpdateField }: PaymentMethodSectionProps) {
  const t = useTranslations("checkout");

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">
          3
        </span>
        {t("paymentMethod")}
      </h2>

      {/* Payment Options */}
      <div className="space-y-4">
        {/* COD Option */}
        <div
          onClick={() => onUpdateField("paymentMethod", "COD")}
          className={cn(
            "border-2 rounded-lg p-4 cursor-pointer transition-all",
            formState.paymentMethod === "COD" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-5 h-5 border-2 rounded-full flex items-center justify-center",
              formState.paymentMethod === "COD" ? "border-black" : "border-gray-300"
            )}>
              {formState.paymentMethod === "COD" && <div className="w-3 h-3 bg-black rounded-full" />}
            </div>
            <Banknote className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium">{t("cod")}</p>
              <p className="text-sm text-muted-foreground">{t("codDesc")}</p>
            </div>
            <Truck className="h-5 w-5 text-green-600" />
          </div>
        </div>

        {/* Stripe / Card Option */}
        <div
          onClick={() => onUpdateField("paymentMethod", "STRIPE")}
          className={cn(
            "border-2 rounded-lg p-4 cursor-pointer transition-all",
            formState.paymentMethod === "STRIPE" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-5 h-5 border-2 rounded-full flex items-center justify-center",
              formState.paymentMethod === "STRIPE" ? "border-black" : "border-gray-300"
            )}>
              {formState.paymentMethod === "STRIPE" && <div className="w-3 h-3 bg-black rounded-full" />}
            </div>
            <CreditCard className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium">Online Payment</p>
              <p className="text-sm text-muted-foreground">Pay securely via Credit Card, Apple Pay, or Google Pay</p>
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold">VISA</div>
              <div className="w-8 h-5 bg-amber-500 rounded flex items-center justify-center text-[8px] text-white font-bold">MC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600">{t("comingSoon")}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Tabby */}
          <div className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg border border-gray-100 opacity-60">
            <div className="w-12 h-8 bg-[#39F9D8] rounded flex items-center justify-center text-black text-[10px] font-bold">
              tabby
            </div>
            <span className="text-xs text-muted-foreground uppercase">Tabby</span>
          </div>
        </div>
      </div>
    </div>
  );
}
