"use client";

import { useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { apiPost } from "@/lib/api-client";
import type { CheckoutFormState, CheckoutItem } from "../types";
import { SHIPPING_COST, DEFAULT_COUNTRY, DEFAULT_ZIP_CODE } from "../constants";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Round up discount amount (29.1 -> 30, 29.9 -> 30)
      const roundedDiscount = discountAmount > 0 ? Math.ceil(discountAmount) : 0;

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
        shippingCost: SHIPPING_COST,
        note: formState.notes,
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

      const endpoint = formState.paymentMethod === "STRIPE" ? "/api/payments/checkout" : (isAuthenticated ? "/api/orders" : "/api/orders/guest");
      const token = isAuthenticated ? getAccessToken() : undefined;
      
      const payload = formState.paymentMethod === "STRIPE" ? {
        ...orderData,
        customerEmail: isAuthenticated ? undefined : formState.email,
        locale,
      } : orderData;

      const data = await apiPost<{ data: { id?: string; orderNumber?: string; url?: string } }>(
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

      // If Stripe, redirect to the provided URL
      if (formState.paymentMethod === "STRIPE" && data.data?.url) {
        window.location.href = data.data.url;
        return;
      }

      // Codes below only run for non-Stripe (COD) orders
      if (!isBuyNow) {
        clearCart();
      }

      // Trigger order success callback (e.g., to refetch orders)
      if (onOrderSuccess) {
        onOrderSuccess();
      }

      // Set orderId last - this triggers the success state
      setOrderId(data.data?.id || data.data?.orderNumber || null);
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
    handleSubmit,
  };
}
