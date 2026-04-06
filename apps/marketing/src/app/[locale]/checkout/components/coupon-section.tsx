"use client";

import { useState } from "react";
import { Tag, X, Loader2, Check, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CouponData {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
}

interface CouponSectionProps {
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  appliedCoupon: CouponData | null;
  discountAmount: number;
  isValidating: boolean;
  error: string | null;
  onApply: () => void;
  onRemove: () => void;
}

export function CouponSection({
  couponCode,
  onCouponCodeChange,
  appliedCoupon,
  discountAmount,
  isValidating,
  error,
  onApply,
  onRemove,
}: CouponSectionProps) {
  const t = useTranslations("checkout");
  const [isExpanded, setIsExpanded] = useState(false);

  if (appliedCoupon) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">
                {t("couponApplied")}
              </p>
              <p className="text-sm text-green-600">
                <span className="font-mono font-semibold">{appliedCoupon.code}</span>
                {" - "}
                {appliedCoupon.discountType === "PERCENTAGE"
                  ? `${appliedCoupon.discountValue}% off`
                  : `LE ${appliedCoupon.discountValue} off`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-700 font-semibold">
              -LE {discountAmount.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 hover:bg-green-100 rounded transition"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("haveCoupon")}</span>
        </div>
        <span className="text-sm text-primary">{isExpanded ? t("hide") : t("show")}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
              placeholder={t("enterCouponCode")}
              className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={isValidating}
            />
            <button
              type="button"
              onClick={onApply}
              disabled={isValidating || !couponCode.trim()}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("validating")}
                </>
              ) : (
                t("apply")
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
