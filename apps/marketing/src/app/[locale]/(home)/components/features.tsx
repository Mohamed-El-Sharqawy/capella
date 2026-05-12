"use client";

import { CreditCard, RotateCcw, Headphones } from "lucide-react";
import { useTranslations } from "next-intl";

export function Features({ locale }: { locale: string }) {
  const t = useTranslations("features");
  const isArabic = locale === "ar";

  const features = [
    {
      icon: CreditCard,
      title: t("flexiblePayment"),
      description: t("flexiblePaymentDesc"),
    },
    {
      icon: RotateCcw,
      title: t("fastReturns"),
      description: t("fastReturnsDesc"),
    },
    {
      icon: Headphones,
      title: t("premiumSupport"),
      description: t("premiumSupportDesc"),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-black/5 bg-white shadow-sm">
                <feature.icon className="h-5 w-5 text-black" strokeWidth={1} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm md:text-base font-medium uppercase" style={{ letterSpacing: isArabic ? "0em" : "0.2em" }}>{feature.title}</h3>
                <p className="text-xs md:text-sm uppercase text-muted-foreground font-light italic" style={{ letterSpacing: isArabic ? "0em" : "0.1em" }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
}
