"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useOrders } from "@/contexts/orders-context";
import { usePaymentMethods } from "@/lib/payment-methods";
import { Link } from "@/i18n/navigation";
import { trackCheckoutView, trackOrderComplete, trackAddPaymentInfo } from "@/lib/analytics";
import {
  useCheckoutForm,
  useBuyNow,
  useSavedAddresses,
  useCheckoutSubmit,
  useCoupon,
  useTabbyEligibility,
} from "./hooks";
import {
  CheckoutSuccess,
  CheckoutLoading,
  CheckoutEmpty,
  ContactInfoSection,
  ShippingAddressSection,
  GuestBenefitsPrompt,
  PaymentMethodSection,
  OrderSummarySection,
  OrderConfirmationModal,
} from "./components";
import { CHECKOUT_ROUTES, getShippingCost } from "./constants";
import type { CheckoutPageClientProps } from "./types";

function CheckoutPageContent({ locale }: CheckoutPageClientProps) {
  const t = useTranslations("checkout");
  const { items: cartItems, total: cartTotal, isLoading: cartLoading } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { fetchOrders } = useOrders();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Buy now mode
  const { isBuyNow, buyNowItem, isBuyNowLoading } = useBuyNow();

  // Determine which items to use (buy-now or cart)
  const items = isBuyNow && buyNowItem ? [buyNowItem] : cartItems;
  const total = isBuyNow && buyNowItem ? buyNowItem.price * buyNowItem.quantity : cartTotal;

  // Saved addresses
  const { savedAddresses, isLoadingAddresses, saveNewAddress } = useSavedAddresses();

  // Form state
  const {
    formState,
    updateField,
    selectedAddressId,
    selectAddress,
    saveAddress,
    setSaveAddress,
  } = useCheckoutForm(savedAddresses);

  // Coupon state
  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    discountAmount,
    isValidating: isCouponValidating,
    error: couponError,
    applyCoupon,
    removeCoupon,
  } = useCoupon(total);

  // Tabby pre-scoring — hide Tabby when Tabby rejects the customer/cart.
  const paymentMethods = usePaymentMethods();
  // Grand total the customer actually pays (items − discount + shipping).
  // getShippingCost already returns 0 at/over the 500 AED threshold, so Tabby
  // excludes shipping there. Both the pre-scoring check and the TabbyCard
  // snippet must use this so they match the order summary and the real charge.
  const roundedDiscount = discountAmount > 0 ? Math.ceil(discountAmount) : 0;
  const tabbyAmount = total - roundedDiscount + getShippingCost(total);
  const tabbyEligibility = useTabbyEligibility({
    amount: tabbyAmount,
    email: formState.email,
    phone: formState.phone,
    enabled: paymentMethods?.tabby ?? false,
  });

  // If the selected method becomes unavailable mid-flow, fall back to COD.
  useEffect(() => {
    if (
      formState.paymentMethod === "TABBY" &&
      tabbyEligibility === "unavailable"
    ) {
      updateField("paymentMethod", "COD");
    }
  }, [formState.paymentMethod, tabbyEligibility, updateField]);

  // Submit handler
  const { isSubmitting, orderId, orderSuccess, completedOrder, handleSubmit } = useCheckoutSubmit({
    items,
    formState,
    isBuyNow,
    selectedAddressId,
    saveAddress,
    onSaveAddress: async () => {
      await saveNewAddress({
        firstName: formState.firstName,
        lastName: formState.lastName,
        phone: formState.phone,
        street: formState.address,
        city: formState.city,
        state: formState.area || formState.city,
      });
    },
    appliedCoupon,
    discountAmount,
    onOrderSuccess: fetchOrders,
    locale,
  });

  const onPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmModalOpen(true);
  };

  const onFinalSubmit = () => {
    setIsConfirmModalOpen(false);
    // Call handleSubmit with a mock event
    handleSubmit({ preventDefault: () => { } } as React.FormEvent);
  };

  const hasTrackedCheckout = useRef(false);
  const hasTrackedPayment = useRef(false);
  const hasTrackedOrder = useRef(false);

  // Track checkout view on mount
  useEffect(() => {
    if (!cartLoading && !authLoading && items.length > 0 && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true;
      trackCheckoutView(items.length, total, items);
    }
  }, [cartLoading, authLoading, items.length, total]);

  // Track order completion
  useEffect(() => {
    if (orderSuccess && completedOrder && !hasTrackedOrder.current) {
      const purchaseKey = `purchase_tracked_${completedOrder.orderId}`;
      if (sessionStorage.getItem(purchaseKey)) {
        hasTrackedOrder.current = true;
        return;
      }
      hasTrackedOrder.current = true;
      sessionStorage.setItem(purchaseKey, "1");
      trackOrderComplete(
        completedOrder.orderId,
        completedOrder.total,
        completedOrder.itemCount,
        completedOrder.items,
      );
    }
  }, [orderSuccess, completedOrder]);

  // Track payment method selection
  useEffect(() => {
    if (formState.paymentMethod && items.length > 0 && !hasTrackedPayment.current) {
      hasTrackedPayment.current = true;
      trackAddPaymentInfo(items, total);
    }
  }, [formState.paymentMethod]);

  // Success state
  if (orderSuccess && orderId) {
    return <CheckoutSuccess orderId={orderId} />;
  }

  // Loading state
  if (cartLoading || authLoading || (isBuyNow && isBuyNowLoading)) {
    return <CheckoutLoading />;
  }

  // Empty cart
  if (!isBuyNow && items.length === 0) {
    return <CheckoutEmpty />;
  }

  return (
    <div className="min-h-[60vh] container mx-auto px-4 pb-8 pt-32 md:pt-36">
      {/* Back to cart */}
      <Link
        href={CHECKOUT_ROUTES.CART}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`} />
        {t("backToCart")}
      </Link>

      <h1 className="text-2xl font-semibold mb-8">{t("title")}</h1>

      <form onSubmit={onPreSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-8">
            <ContactInfoSection formState={formState} onUpdateField={updateField} />

            <ShippingAddressSection
              formState={formState}
              onUpdateField={updateField}
              savedAddresses={savedAddresses}
              isLoadingAddresses={isLoadingAddresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={selectAddress}
              saveAddress={saveAddress}
              onSaveAddressChange={setSaveAddress}
            />

            {/* Guest checkout benefits prompt */}
            {!isAuthenticated && <GuestBenefitsPrompt />}

            <PaymentMethodSection
              formState={formState}
              onUpdateField={updateField}
              tabbyEligibility={tabbyEligibility}
              total={tabbyAmount}
              locale={locale}
            />
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummarySection
              items={items}
              total={total}
              locale={locale}
              isSubmitting={isSubmitting}
              appliedCoupon={appliedCoupon}
              discountAmount={discountAmount}
              couponProps={{
                couponCode,
                onCouponCodeChange: setCouponCode,
                appliedCoupon,
                discountAmount,
                isValidating: isCouponValidating,
                error: couponError,
                onApply: () => applyCoupon(total),
                onRemove: removeCoupon,
              }}
            />
          </div>
        </div>
      </form>

      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onFinalSubmit}
        items={items}
        total={total}
        formState={formState}
        discountAmount={discountAmount}
        shippingCost={getShippingCost(total)}
        locale={locale}
      />
    </div>
  );
}

export function CheckoutPageClient(props: CheckoutPageClientProps) {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent {...props} />
    </Suspense>
  );
}
