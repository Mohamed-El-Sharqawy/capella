"use client";

import { useState, useCallback } from "react";
import { apiPost } from "@/lib/api-client";

interface CouponData {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
}

interface ValidateCouponResponse {
  success: boolean;
  data?: {
    coupon: CouponData;
    discountAmount: number;
    finalTotal: number;
  };
  error?: string;
}

interface UseCouponReturn {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: CouponData | null;
  discountAmount: number;
  isValidating: boolean;
  error: string | null;
  applyCoupon: (orderTotal: number, userId?: string) => Promise<boolean>;
  removeCoupon: () => void;
}

export function useCoupon(): UseCouponReturn {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCoupon = useCallback(async (orderTotal: number, userId?: string): Promise<boolean> => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return false;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await apiPost<ValidateCouponResponse>("/api/coupons/validate", {
        code: couponCode.trim().toUpperCase(),
        orderTotal,
        userId,
      });

      if (response.success && response.data) {
        setAppliedCoupon(response.data.coupon);
        setDiscountAmount(response.data.discountAmount);
        setError(null);
        return true;
      } else {
        setError(response.error || "Invalid coupon code");
        return false;
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to validate coupon";
      setError(errorMessage);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [couponCode]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setError(null);
  }, []);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    discountAmount,
    isValidating,
    error,
    applyCoupon,
    removeCoupon,
  };
}
