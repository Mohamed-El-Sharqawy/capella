"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Shield, Tag, X, Check, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CheckoutItem } from "../types";
import { SHIPPING_COST } from "../constants";

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

interface OrderSummarySectionProps {
  items: CheckoutItem[];
  total: number;
  locale: string;
  isSubmitting: boolean;
  appliedCoupon?: CouponData | null;
  discountAmount?: number;
  couponProps?: CouponSectionProps;
}

export function OrderSummarySection({
  items,
  total,
  locale,
  isSubmitting,
  appliedCoupon,
  discountAmount = 0,
  couponProps,
}: OrderSummarySectionProps) {
  const t = useTranslations("checkout");
  const isArabic = locale === "ar";
  // Round up discount amount (29.1 -> 30, 29.9 -> 30)
  const roundedDiscount = discountAmount > 0 ? Math.ceil(discountAmount) : 0;
  const grandTotal = total - roundedDiscount + SHIPPING_COST;
  const [isCouponExpanded, setIsCouponExpanded] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <h2 className="text-lg font-semibold mb-4">{t("orderSummary")}</h2>

      {/* Items */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-3">
            <div className="w-14 h-18 bg-white rounded overflow-hidden relative shrink-0">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={isArabic ? item.productNameAr : item.productNameEn}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">
                {isArabic ? item.productNameAr : item.productNameEn}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.colorNameEn && (isArabic ? item.colorNameAr : item.colorNameEn)}
                {item.sizeNameEn && ` / ${isArabic ? item.sizeNameAr : item.sizeNameEn}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("qty")} {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium">LE {(item.price * item.quantity).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span>LE {total.toLocaleString()}</span>
        </div>
        {appliedCoupon && roundedDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              {t("discount")}
              <span className="text-xs font-mono bg-green-100 px-1.5 py-0.5 rounded">
                {appliedCoupon.code}
              </span>
            </span>
            <span>-LE {roundedDiscount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("shipping")}</span>
          <span>LE {SHIPPING_COST.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>{t("total")}</span>
          <span>LE {grandTotal.toLocaleString()} EGP</span>
        </div>
      </div>

      {/* Coupon Section - Above Place Order */}
      {couponProps && (
        <div className="mt-4">
          {couponProps.appliedCoupon ? (
            <div className="border border-green-200 bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {t("couponApplied")}
                    </p>
                    <p className="text-xs text-green-600">
                      <span className="font-mono font-semibold">{couponProps.appliedCoupon.code}</span>
                      {" - "}
                      {couponProps.appliedCoupon.discountType === "PERCENTAGE"
                        ? `${couponProps.appliedCoupon.discountValue}% off`
                        : `LE ${couponProps.appliedCoupon.discountValue} off`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={couponProps.onRemove}
                  className="p-1 hover:bg-green-100 rounded transition"
                  aria-label="Remove coupon"
                >
                  <X className="h-4 w-4 text-green-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCouponExpanded(!isCouponExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition text-sm"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{t("haveCoupon")}</span>
                </div>
                <span className="text-primary text-xs">{isCouponExpanded ? t("hide") : t("show")}</span>
              </button>

              {isCouponExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponProps.couponCode}
                      onChange={(e) => couponProps.onCouponCodeChange(e.target.value.toUpperCase())}
                      placeholder={t("enterCouponCode")}
                      className="flex-1 px-3 py-2 border rounded text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      disabled={couponProps.isValidating}
                    />
                    <button
                      type="button"
                      onClick={couponProps.onApply}
                      disabled={couponProps.isValidating || !couponProps.couponCode.trim()}
                      className="px-3 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {couponProps.isValidating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        t("apply")
                      )}
                    </button>
                  </div>

                  {couponProps.error && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>{couponProps.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("processing")}
          </>
        ) : (
          <>{t("placeOrder")}</>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" />
        {t("infoSecure")}
      </div>
    </div>
  );
}
