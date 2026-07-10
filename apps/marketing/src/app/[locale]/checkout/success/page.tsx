"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, Package, Loader2, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { apiGet } from "@/lib/api-client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment_intent_id?: string; payment_id?: string }>;
}

type Phase = "confirming" | "success" | "timeout";

const CONFIRMED_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const FAILED_STATUSES = ["CANCELLED", "REFUNDED"];

export default function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = React.use(params);
  const { payment_intent_id, payment_id } = React.use(searchParams);
  const sessionId = payment_intent_id || payment_id;
  const t = useTranslations("checkout");
  const { clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Tabby redirects with payment_id. Ziina redirects with payment_intent_id.
  // The success page must NOT capture — capture is webhook-only. For Tabby we
  // additionally verify the order is CONFIRMED before clearing the cart, so
  // cart-clearing is tied to an actual captured payment, not just the redirect.
  const isTabby = !!payment_id;
  const [phase, setPhase] = useState<Phase>(isTabby ? "confirming" : "success");
  const clearedRef = useRef(false);

  const safeClearCart = () => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  };

  // Non-Tabby providers: keep existing behaviour (clear cart on success redirect).
  useEffect(() => {
    if (!isTabby) safeClearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabby]);

  // Tabby: poll backend order status; clear the cart only once CONFIRMED.
  useEffect(() => {
    if (!isTabby || !payment_id) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = Date.now();
    const TIMEOUT_MS = 45000;
    const INTERVAL = 2500;

    const poll = async () => {
      if (!active) return;
      try {
        const res = await apiGet<{ data: { orderStatus: string | null } }>(
          `/api/payments/tabby/status?payment_id=${encodeURIComponent(payment_id)}`
        );
        if (!active) return;
        const orderStatus = res.data?.orderStatus;

        if (orderStatus && CONFIRMED_STATUSES.includes(orderStatus)) {
          safeClearCart();
          setPhase("success");
          return;
        }
        if (orderStatus && FAILED_STATUSES.includes(orderStatus)) {
          // Payment did not succeed — cart retained, show the rejection page.
          window.location.replace(`/${locale}/checkout/cancel?reason=rejected`);
          return;
        }
        if (Date.now() - start >= TIMEOUT_MS) {
          setPhase("timeout");
          return;
        }
        timer = setTimeout(poll, INTERVAL);
      } catch {
        if (!active) return;
        if (Date.now() - start >= TIMEOUT_MS) {
          setPhase("timeout");
          return;
        }
        timer = setTimeout(poll, INTERVAL);
      }
    };

    timer = setTimeout(poll, INTERVAL);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabby, payment_id]);

  // Confirming payment (Tabby webhook may fire before/after the customer lands)
  if (phase === "confirming") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-16 pt-32 md:pt-36">
        <div className="max-w-md w-full mx-auto text-center px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
            {t("success.confirmingTitle")}
          </h1>
          <p className="text-gray-600 mb-6">{t("success.confirmingMessage")}</p>
          {sessionId && (
            <p className="text-sm text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
              {t("sessionId")}
              <span className="font-sans text-[10px]">{sessionId}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Timed out while still pending — don't claim success, don't clear the cart.
  if (phase === "timeout") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-16 pt-32 md:pt-36">
        <div className="max-w-md w-full mx-auto text-center px-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
            {t("success.timeoutTitle")}
          </h1>
          <p className="text-gray-600 mb-6">{t("success.timeoutMessage")}</p>
          {isAuthenticated && (
            <Link
              href="/account?tab=orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition font-medium"
            >
              <Package className="w-4 h-4" />
              {t("viewMyOrders")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 pt-32 md:pt-36">
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

        {sessionId && (
          <p className="text-sm text-gray-400 mb-8 overflow-hidden text-ellipsis whitespace-nowrap">
            {t("sessionId")}
            <span className="font-sans text-[10px]">{sessionId}</span>
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
