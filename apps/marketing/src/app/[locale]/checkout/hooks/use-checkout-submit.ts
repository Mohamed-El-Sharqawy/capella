"use client";

import { useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { apiPost } from "@/lib/api-client";
import { getFbp, getFbc } from "@/lib/meta-cookies";
import { savePendingPurchase } from "@/lib/analytics";
import type { CheckoutFormState, CheckoutItem } from "../types";
import { DEFAULT_COUNTRY, DEFAULT_ZIP_CODE, getShippingCost } from "../constants";

interface CouponData {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
}

interface UseCheckoutSubmitOptions {
  items: CheckoutItem[];
  formState: CheckoutFormState;
  isBuyNow: boolean;
  selectedAddressId: string | null;
  saveAddress: boolean;
  onSaveAddress: () => Promise<void>;
  appliedCoupon?: CouponData | null;
  discountAmount?: number;
  onOrderSuccess?: () => void;
  locale: string;
}

export function useCheckoutSubmit({
  items,
  formState,
  isBuyNow,
  selectedAddressId,
  saveAddress,
  onSaveAddress,
  appliedCoupon,
  discountAmount = 0,
  onOrderSuccess,
  locale,
}: UseCheckoutSubmitOptions) {
  const t = useTranslations("checkout");
  const { isAuthenticated, getAccessToken } = useAuth();
  const { clearCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useQueryState("orderId", parseAsString);
  const orderSuccess = !!orderId;
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string;
    total: number;
    itemCount: number;
    items: CheckoutItem[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Round up discount amount (29.1 -> 30, 29.9 -> 30)
      const roundedDiscount = discountAmount > 0 ? Math.ceil(discountAmount) : 0;
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const orderData = {
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingFirstName: formState.firstName,
        shippingLastName: formState.lastName,
        shippingStreet: formState.address,
        shippingCity: formState.city,
        shippingState: formState.area || formState.city,
        shippingZipCode: DEFAULT_ZIP_CODE,
        shippingCountry: DEFAULT_COUNTRY,
        shippingPhone: formState.phone,
        shippingCost: getShippingCost(subtotal),
        note: formState.notes,
        fbp: getFbp(),
        fbc: getFbc(),
        // Coupon data
        ...(appliedCoupon ? {
          couponCode: appliedCoupon.code,
          discountAmount: roundedDiscount,
        } : {}),
        ...(isAuthenticated
          ? {}
          : {
              guestEmail: formState.email,
              guestFirstName: formState.firstName,
              guestLastName: formState.lastName,
              guestPhone: formState.phone,
            }),
      };

      const isOnlinePayment =
        formState.paymentMethod === "ZIINA" ||
        formState.paymentMethod === "TABBY" ||
        formState.paymentMethod === "TAMARA";

      const endpoint = isOnlinePayment ? "/api/payments/checkout" : (isAuthenticated ? "/api/orders" : "/api/orders/guest");
      const token = isAuthenticated ? getAccessToken() : undefined;
      
      const payload = isOnlinePayment ? {
        ...orderData,
        customerEmail: isAuthenticated ? undefined : formState.email,
        method: formState.paymentMethod,
        locale,
      } : orderData;

      const data = await apiPost<{ data: { id?: string; orderId?: string; orderNumber?: string; url?: string } }>(
        endpoint,
        payload,
        { token: token || undefined }
      );

      // Save address for future use if user is authenticated and checkbox is checked
      if (isAuthenticated && saveAddress && !selectedAddressId) {
        try {
          await onSaveAddress();
        } catch (addrError) {
          console.error("Failed to save address:", addrError);
          // We don't block checkout if address saving fails, but we log it
        }
      }

      // If online payment, redirect to the provider-hosted checkout URL.
      // Persist the order snapshot first so the success page (loaded after the
      // provider redirect) can fire the browser Purchase with the real value —
      // only once the webhook confirms the payment (see success/page.tsx).
      if (isOnlinePayment && data.data?.url) {
        const onlineOrderId = data.data.orderId || data.data.id || data.data.orderNumber;
        if (onlineOrderId) {
          savePendingPurchase({
            orderId: onlineOrderId,
            total: subtotal - roundedDiscount + getShippingCost(subtotal),
            itemCount: items.length,
            items: items.map((i) => ({ variantId: i.variantId, sku: i.sku })),
          });
        }
        window.location.href = data.data.url;
        return;
      }

      // Codes below only run for non-Ziina (COD) orders

      // Snapshot order value/items BEFORE clearCart() empties the cart context.
      // The success-state effect in client.tsx previously read total/items from
      // useCart() after it was zeroed, firing the browser Pixel Purchase with
      // value=0 (Meta rejects values that are not greater than 0).
      const createdOrderId = data.data?.id || data.data?.orderNumber || null;
      setCompletedOrder({
        orderId: createdOrderId ?? "",
        total: subtotal - roundedDiscount + getShippingCost(subtotal),
        itemCount: items.length,
        items,
      });

      if (!isBuyNow) {
        clearCart();
      }

      // Trigger order success callback (e.g., to refetch orders)
      if (onOrderSuccess) {
        onOrderSuccess();
      }

      // Set orderId last - this triggers the success state
      setOrderId(createdOrderId);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(`${t("orderFailed")} ${t("tryAgain")}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    orderId,
    orderSuccess,
    completedOrder,
    handleSubmit,
  };
}
