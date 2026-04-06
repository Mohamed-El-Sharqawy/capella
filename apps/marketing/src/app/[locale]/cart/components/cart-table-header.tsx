"use client";

import { useTranslations } from "next-intl";

export function CartTableHeader() {
  const t = useTranslations("cart");

  return (
    <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b text-sm font-medium text-muted-foreground">
      <div className="col-span-6">{t("product")}</div>
      <div className="col-span-2 text-center">{t("price")}</div>
      <div className="col-span-2 text-center">{t("quantity")}</div>
      <div className="col-span-2 text-right">{t("total")}</div>
    </div>
  );
}
