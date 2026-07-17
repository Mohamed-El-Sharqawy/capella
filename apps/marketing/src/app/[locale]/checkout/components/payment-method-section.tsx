"use client";

import type { CheckoutFormState } from "../types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import Image from "next/image";
import tabbyLogo from "@/assets/tabby_logo.png";
import tamaraLogoEn from "@/assets/tamara_logo_en.png";
import tamaraLogoAr from "@/assets/tamara_logo_ar.png";
import { usePaymentMethods } from "@/lib/payment-methods";
import type { TabbyEligibility } from "../hooks";
import { TabbyCardSnippet } from "./tabby-card-snippet";
import { TamaraCheckoutSnippet } from "./tamara-checkout-snippet";

interface PaymentMethodSectionProps {
  formState: CheckoutFormState;
  onUpdateField: (field: keyof CheckoutFormState, value: string) => void;
  tabbyEligibility?: TabbyEligibility;
  total: number;
  locale: string;
}

export function PaymentMethodSection({
  formState,
  onUpdateField,
  tabbyEligibility = "loading",
  total,
  locale,
}: PaymentMethodSectionProps) {
  const t = useTranslations("checkout");
  const enabled = usePaymentMethods();
  const tabbyEnabled = enabled?.tabby ?? false;
  const tabbyVisible = tabbyEnabled && tabbyEligibility !== "unavailable";
  const tamaraEnabled = enabled?.tamara ?? false;
  const tabbySelected = formState.paymentMethod === "TABBY";

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
      // Official approved payment-method name (EN/AR) from the Tabby docs.
      label: t("tabbyName"),
      brand: (
        <Image
          src={tabbyLogo}
          alt="tabby"
          width={46}
          height={18}
          className="object-contain"
        />
      ),
    },
    {
      id: "TAMARA" as const,
      icon: Wallet,
      label: t("tamaraName"),
      brand: (
        <Image
          src={locale === "ar" ? tamaraLogoEn : tamaraLogoAr}
          alt="tamara"
          width={40}
          height={20}
          className="object-contain"
        />
      ),
    },
  ];

  const visibleMethods = allMethods.filter((m) => {
    if (m.id === "TABBY") return tabbyVisible;
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
            <div key={id}>
              <div
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
                    {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
                  </div>
                </div>
              </div>
              {/* Official Tabby Checkout snippet — renders approved copy and
                  stays compliant if Tabby's wording changes. */}
              {id === "TABBY" && selected && (
                <div className="mt-2 pl-8">
                  <TabbyCardSnippet price={total} locale={locale} />
                </div>
              )}
              {id === "TAMARA" && selected && (
                <div className="mt-2 pl-8">
                  <TamaraCheckoutSnippet price={total} locale={locale} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
