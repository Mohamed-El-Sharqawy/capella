"use client";

import { ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { CART_ROUTES } from "../constants";

export function EmptyCart() {
  const t = useTranslations("cart");

  return (
    <div className="max-w-md mx-auto text-center">
      <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
      <h1 className="text-2xl font-semibold mb-4">{t("empty")}</h1>
      <p className="text-muted-foreground mb-8">{t("emptyDesc")}</p>
      <Link
        href={CART_ROUTES.COLLECTIONS}
        className="inline-block px-8 py-3 bg-black text-white font-medium rounded hover:bg-gray-800 transition"
      >
        {t("startShopping")}
      </Link>
    </div>
  );
}
