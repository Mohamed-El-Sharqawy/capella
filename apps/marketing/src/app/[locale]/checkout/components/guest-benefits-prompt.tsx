"use client";

import { Gift, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CHECKOUT_ROUTES } from "../constants";

export function GuestBenefitsPrompt() {
  const t = useTranslations("checkout");

  return (
    <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Gift className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-amber-800">{t("signInBenefits")}</p>
          <ul className="text-sm text-amber-700 mt-1 space-y-1">
            <li>• {t("trackOrders")}</li>
            <li>• {t("exclusiveOffers")}</li>
            <li>• {t("saveAddresses")}</li>
          </ul>
          <Link
            href={CHECKOUT_ROUTES.SIGNIN}
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900 mt-2"
          >
            <User className="h-4 w-4" />
            {t("signInNow")}
          </Link>
        </div>
      </div>
    </div>
  );
}
