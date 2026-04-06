"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CHECKOUT_ROUTES } from "../constants";

interface CheckoutSuccessProps {
  orderId: string;
}

export function CheckoutSuccess({ orderId }: CheckoutSuccessProps) {
  const t = useTranslations("checkout");
  const { isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold mb-4">{t("orderConfirmed")}</h1>
        <p className="text-muted-foreground mb-2">{t("orderConfirmedDesc")}</p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-8">
            {t("orderId")} <span className="font-mono font-medium">{orderId}</span>
          </p>
        )}
        <div className="space-y-3">
          <Link
            href={CHECKOUT_ROUTES.COLLECTIONS}
            className="block w-full py-3 bg-black text-white font-medium rounded hover:bg-gray-800 transition"
          >
            {t("continueShopping")}
          </Link>
          {isAuthenticated && (
            <Link
              href={CHECKOUT_ROUTES.ACCOUNT_ORDERS}
              className="block w-full py-3 border border-black font-medium rounded hover:bg-gray-100 transition"
            >
              {t("viewMyOrders")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
