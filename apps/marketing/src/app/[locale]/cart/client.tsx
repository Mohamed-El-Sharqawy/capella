"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { useSuggestedProducts, useOrderNote } from "./hooks";
import {
  EmptyCart,
  CartItem,
  CartTableHeader,
  OrderNoteSection,
  OrderSummary,
  SuggestedProducts,
} from "./components";
import type { CartPageClientProps } from "./types";

export function CartPageClient({ locale }: CartPageClientProps) {
  const t = useTranslations("cart");
  const { items, total, updateQuantity, removeItem } = useCart();
  const suggestedProducts = useSuggestedProducts(items);
  const { orderNote, setOrderNote } = useOrderNote();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyCart />
        <SuggestedProducts
          products={suggestedProducts}
          locale={locale}
          title={t("youMayLike")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-center mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <CartTableHeader />

          <div className="divide-y">
            {items.map((item) => (
              <CartItem
                key={item.variantId}
                item={item}
                locale={locale}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>

          <OrderNoteSection value={orderNote} onChange={setOrderNote} />
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary total={total} />
        </div>
      </div>

      <SuggestedProducts
        products={suggestedProducts}
        locale={locale}
        title={t("suggestedTitle")}
      />
    </div>
  );
}
