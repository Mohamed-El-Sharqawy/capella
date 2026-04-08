"use client";

import * as React from "react";
import { useEffect } from "react";
import { CheckCircle, Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = React.use(params);
  const { session_id } = React.use(searchParams);
  const t = useTranslations("checkout");
  const { clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const isArabic = locale === "ar";

  // Clear the cart on success
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <div className="max-w-md w-full mx-auto text-center px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
          {t("success.title")}
        </h1>

        <p className="text-gray-600 mb-6">
          {t("success.message")}
        </p>

        {session_id && (
          <p className="text-sm text-gray-400 mb-8 overflow-hidden text-ellipsis whitespace-nowrap">
            {isArabic ? "معرف الجلسة: " : "Session ID: "}
            <span className="font-mono text-[10px]">{session_id}</span>
          </p>
        )}

        <div className="flex flex-col gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition font-medium"
          >
            {t("continueShopping")}
          </Link>

          {isAuthenticated && (
            <Link
              href="/account?tab=orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-black rounded hover:bg-gray-50 transition font-medium"
            >
              <Package className="w-4 h-4" />
              {t("viewMyOrders")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
