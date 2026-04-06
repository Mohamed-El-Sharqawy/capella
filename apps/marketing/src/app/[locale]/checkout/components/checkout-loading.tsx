"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function CheckoutLoading() {
  const t = useTranslations("checkout");

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
      <p className="text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
