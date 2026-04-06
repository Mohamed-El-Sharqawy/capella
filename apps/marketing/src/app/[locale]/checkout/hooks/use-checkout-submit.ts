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

      const endpoint = isAuthenticated ? "/api/orders" : "/api/orders/guest";
      const token = isAuthenticated ? getAccessToken() : undefined;
      const data = await apiPost<{ data: { id?: string; orderNumber?: string } }>(
        endpoint,
        orderData,
        { token: token || undefined }
      );

      // Only clear cart when purchasing from cart (not buy-now)
      if (!isBuyNow) {
        clearCart();
      }

      // Save address for future use if user is authenticated and checkbox is checked
      if (isAuthenticated && saveAddress && !selectedAddressId) {
        await onSaveAddress();
      }

      // Trigger order success callback (e.g., to refetch orders)
      if (onOrderSuccess) {
        onOrderSuccess();
      }

      // Set orderId last - this triggers the success state
      setOrderId(data.data?.id || data.data?.orderNumber || null);
    } catch {
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
