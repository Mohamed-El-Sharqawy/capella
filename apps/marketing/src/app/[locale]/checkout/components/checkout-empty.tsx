"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CHECKOUT_ROUTES } from "../constants";

export function CheckoutEmpty() {
  const t = useTranslations("checkout");

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-4">{t("emptyCart")}</h1>
      <Link
        href={CHECKOUT_ROUTES.COLLECTIONS}
        className="inline-block px-8 py-3 bg-black text-white font-medium rounded hover:bg-gray-800 transition"
      >
        {t("startShopping")}
      </Link>
    </div>
  );
}
