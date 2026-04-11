"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryState, parseAsString } from "nuqs";
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

export function useCoupon(initialTotal?: number): UseCouponReturn {
  const [couponQuery, setCouponQuery] = useQueryState("coupon", parseAsString.withDefault(""));
  const [couponCode, setCouponCodeState] = useState(couponQuery);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync internal state with query param
  const setCouponCode = useCallback((code: string) => {
    setCouponCodeState(code);
    setCouponQuery(code || null);
  }, [setCouponQuery]);

  const applyCoupon = useCallback(async (orderTotal: number, userId?: string, codeToUse?: string): Promise<boolean> => {
    const code = (codeToUse || couponCode).trim().toUpperCase();
    
    if (!code) {
      setError("Please enter a coupon code");
      return false;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await apiPost<ValidateCouponResponse>("/api/coupons/validate", {
        code,
        orderTotal,
        userId,
      });

      if (response.success && response.data) {
        setAppliedCoupon(response.data.coupon);
        setDiscountAmount(response.data.discountAmount);
        setError(null);
        // Ensure URL matches the successfully applied coupon
        setCouponQuery(code);
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
  }, [couponCode, setCouponQuery]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setError(null);
  }, [setCouponCode]);

  // Auto-apply on mount if coupon exists in URL and we have a total
  useEffect(() => {
    if (couponQuery && !appliedCoupon && !isValidating && initialTotal && initialTotal > 0) {
      applyCoupon(initialTotal, undefined, couponQuery);
    }
  }, [initialTotal]); // Only run when total is available/changes

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
