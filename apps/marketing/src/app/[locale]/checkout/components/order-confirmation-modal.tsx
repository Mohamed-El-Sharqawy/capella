"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Truck, CreditCard, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CheckoutItem, CheckoutFormState } from "../types";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: CheckoutItem[];
  total: number;
  formState: CheckoutFormState;
  discountAmount: number;
  shippingCost: number;
  locale: string;
}

export function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  total,
  formState,
  discountAmount,
  shippingCost,
  locale,
}: OrderConfirmationModalProps) {
  const t = useTranslations("checkout");
  const isArabic = locale === "ar";
  const finalTotal = total - discountAmount + shippingCost;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between bg-gray-50">
            <h2 className="text-xl font-serif font-bold text-gray-900">
              {isArabic ? "مراجعة الطلب" : "Review Order"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Items Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ShoppingBag className="w-4 h-4" />
                {t("orderSummary")} ({items.length} {isArabic ? "منتجات" : "items"})
              </div>
              <div className="space-y-2">
                {items.slice(0, 4).map((item) => (
                  <div key={item.variantId} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={isArabic ? item.productNameAr : item.productNameEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 italic text-[10px] text-gray-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {isArabic ? item.productNameAr : item.productNameEn}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity}x {item.price} {isArabic ? "درهم" : "AED"}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {item.price * item.quantity} {isArabic ? "درهم" : "AED"}
                    </div>
                  </div>
                ))}
                {items.length > 4 && (
                  <p className="text-xs text-blue-600 font-medium py-1">
                    + {items.length - 4} {isArabic ? "منتجات أخرى في سلتك" : "more items in your cart"}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Truck className="w-4 h-4" />
                {isArabic ? "تفاصيل الشحن" : "Shipping Details"}
              </div>
              <p className="text-sm text-gray-700">
                {formState.firstName} {formState.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {formState.phone}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {formState.address}, {formState.city}, {formState.area}
              </p>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span>{isArabic ? "طريقة الدفع" : "Payment Method"}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formState.paymentMethod === "STRIPE" ? (isArabic ? "بطاقة ائتمان" : "Credit Card") :
                  formState.paymentMethod === "TABBY" ? "Tabby" :
                    (isArabic ? "دفع عند الاستلام" : "Cash on Delivery")}
              </span>
            </div>

            {/* Total Breakdown */}
            <div className="pt-4 border-t border-dashed space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("subtotal")}</span>
                <span>{total} {isArabic ? "درهم" : "AED"}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t("discount")}</span>
                  <span>-{discountAmount} {isArabic ? "درهم" : "AED"}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("shipping")}</span>
                <span>{shippingCost} {isArabic ? "درهم" : "AED"}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>{t("total")}</span>
                <span>{finalTotal} {isArabic ? "درهم" : "AED"}</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-6 bg-gray-50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isArabic ? "رجوع" : "Back"}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              {isArabic ? "تأكيد الطلب" : "Confirm Order"}
              <ChevronRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
