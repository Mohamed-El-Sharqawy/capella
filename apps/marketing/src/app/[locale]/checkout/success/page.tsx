"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, Package, Loader2, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { apiGet } from "@/lib/api-client";
import {
  trackOrderComplete,
  getPendingPurchase,
  clearPendingPurchase,
  type PendingPurchase,
} from "@/lib/analytics";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment_intent_id?: string; payment_id?: string }>;
}

type Phase = "confirming" | "success" | "timeout";

const CONFIRMED_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const FAILED_STATUSES = ["CANCELLED", "REFUNDED"];

const POLL_TIMEOUT_MS = 45000;
const POLL_INTERVAL = 2500;

export default function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = React.use(params);
  const { payment_intent_id, payment_id } = React.use(searchParams);
  const sessionId = payment_intent_id || payment_id;
  const t = useTranslations("checkout");
  const { clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  // The order snapshot is persisted to sessionStorage just before redirecting
  // to the hosted payment page. If absent (e.g. page opened directly, private
  // mode, or cross-tab navigation) we cannot verify payment or recover totals,
  // so we fall back to the legacy "show success" behaviour without firing a
  // browser Purchase — the server CAPI event still fires from the webhook.
  const pendingRef = useRef<PendingPurchase | null>(getPendingPurchase());
  const hasPending = !!pendingRef.current;
  const [phase, setPhase] = useState<Phase>(hasPending ? "confirming" : "success");
  const clearedRef = useRef(false);
  const trackedRef = useRef(false);

  const safeClearCart = () => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  };

  // No pending snapshot — keep existing behaviour (clear cart, show success).
  useEffect(() => {
    if (!hasPending) safeClearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending]);

  // Poll the backend order status until the webhook marks the order CONFIRMED.
  // Only then do we clear the cart and fire the browser Purchase — this avoids
  // counting purchases for abandoned/failed/cancelled provider checkouts.
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = Date.now();

    const poll = async () => {
      if (!active) return;
      try {
        const res = await apiGet<{ data: { orderStatus: string | null } }>(
          `/api/payments/order-status?orderId=${encodeURIComponent(pending.orderId)}`
        );
        if (!active) return;
        const orderStatus = res.data?.orderStatus;

        if (orderStatus && CONFIRMED_STATUSES.includes(orderStatus)) {
          safeClearCart();
          if (!trackedRef.current) {
            trackedRef.current = true;
            trackOrderComplete(
              pending.orderId,
              pending.total,
              pending.itemCount,
              pending.items,
            );
            clearPendingPurchase();
          }
          setPhase("success");
          return;
        }
        if (orderStatus && FAILED_STATUSES.includes(orderStatus)) {
          clearPendingPurchase();
          window.location.replace(`/${locale}/checkout/cancel?reason=rejected`);
          return;
        }
        if (Date.now() - start >= POLL_TIMEOUT_MS) {
          setPhase("timeout");
          return;
        }
        timer = setTimeout(poll, POLL_INTERVAL);
      } catch {
        if (!active) return;
        if (Date.now() - start >= POLL_TIMEOUT_MS) {
          setPhase("timeout");
          return;
        }
        timer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    timer = setTimeout(poll, POLL_INTERVAL);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending]);

  // Confirming payment (webhook may fire before/after the customer lands)
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
