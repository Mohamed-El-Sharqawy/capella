"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { useDrawerState, useSuggestedProducts } from "./hooks";
import {
  DrawerHeader,
  EmptyState,
  CartItemRow,
  SuggestedItem,
  DrawerFooter,
} from "./components";
import { DRAWER_CLASSES } from "./constants";
import type { CartDrawerProps } from "./types";

export function CartDrawer({ locale }: CartDrawerProps) {
  const t = useTranslations("cartDrawer");
  const { items, total, isOpen, closeCart, updateQuantity, removeItem, shopNow } = useCart();
  const suggestedProducts = useSuggestedProducts(items, isOpen);
  useDrawerState(isOpen);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${DRAWER_CLASSES.backdrop} ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`${DRAWER_CLASSES.drawer} ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <DrawerHeader onClose={closeCart} />

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState onClose={shopNow} />
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  locale={locale}
                  onClose={closeCart}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}

          {/* Suggested Products */}
          {suggestedProducts.length > 0 && (
            <div className="border-t p-4">
              <h3 className="text-sm font-semibold mb-3">{t("youMayLike")}</h3>
              <div className="grid grid-cols-2 gap-3">
                {suggestedProducts.map((product) => (
                  <SuggestedItem
                    key={product.id}
                    product={product}
                    locale={locale}
                    onClose={closeCart}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter total={total} itemCount={items.length} onClose={closeCart} />
      </div>
    </>
  );
}
