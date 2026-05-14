"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CHECKOUT_ROUTES } from "../constants";
import Image from "next/image";

export function CheckoutEmpty() {
  const t = useTranslations("checkout");

  return (
    <div className="min-h-[60vh] container mx-auto px-4 pb-8 pt-32 md:pt-36 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="relative w-72 h-72 mx-auto mb-8">
          <Image
            src="/checkout/illustrations/empty.svg"
            alt="Empty cart"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-3">
          {t("emptyCart")}
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t("emptyCartDesc")}
        </p>

        <Link
          href={CHECKOUT_ROUTES.COLLECTIONS}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          {t("startShopping")}
        </Link>
      </div>
    </div>
  );
}
