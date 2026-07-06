"use client";

import type { CheckoutFormState } from "../types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import { usePaymentMethods } from "@/lib/payment-methods";

interface PaymentMethodSectionProps {
  formState: CheckoutFormState;
  onUpdateField: (field: keyof CheckoutFormState, value: string) => void;
}

export function PaymentMethodSection({ formState, onUpdateField }: PaymentMethodSectionProps) {
  const t = useTranslations("checkout");
  const enabled = usePaymentMethods();
  const tabbyEnabled = enabled?.tabby ?? false;
  const tamaraEnabled = enabled?.tamara ?? false;

  const allMethods = [
    {
      id: "COD" as const,
      icon: Banknote,
      label: t("cod"),
      desc: t("codDesc"),
    },
    {
      id: "ZIINA" as const,
      icon: CreditCard,
      label: t("onlinePayment"),
      desc: t("onlinePaymentDesc"),
    },
    {
      id: "TABBY" as const,
      icon: Wallet,
      label: "Tabby",
      desc: t("tabbyDesc"),
      brand: (
        <span className="px-2 py-1 bg-[#39F9D8] text-black text-[11px] font-bold rounded">
          tabby
        </span>
      ),
    },
    {
      id: "TAMARA" as const,
      icon: Wallet,
      label: "Tamara",
      desc: t("tamaraDesc"),
      brand: (
        <span className="px-2 py-1 bg-[#97D700] text-black text-[11px] font-bold rounded">
          tamara
        </span>
      ),
    },
  ];

  const visibleMethods = allMethods.filter((m) => {
    if (m.id === "TABBY") return tabbyEnabled;
    if (m.id === "TAMARA") return tamaraEnabled;
    return true;
  });

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
        {visibleMethods.map(({ id, icon: Icon, label, desc, brand }) => {
          const selected = formState.paymentMethod === id;
          return (
            <div
              key={id}
              onClick={() => onUpdateField("paymentMethod", id)}
              className={cn(
                "border-2 rounded-lg p-4 cursor-pointer transition-all",
                selected ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0",
                  selected ? "border-black" : "border-gray-300"
                )}>
                  {selected && <div className="w-3 h-3 bg-black rounded-full" />}
                </div>
                <Icon className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{label}</p>
                    {brand}
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
