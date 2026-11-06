"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import {
  type CartItem,
  getGuestCart,
  addToGuestCart,
  updateGuestCartQuantity,
  removeFromGuestCart,
  clearGuestCart,
  getCartItemCount,
  getCartTotal,
  saveGuestCart,
  applyAvailability,
  isCartItemUnavailable,
} from "@/lib/cart";
import { fetchAvailability } from "@/lib/stock";
import { useRouter } from "next/navigation";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Adds up to the item's available stock; returns the number of units added. */
  addItem: (item: CartItem) => number;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  shopNow: () => void;
  /** Re-check every cart item against live stock (adjusts quantities, flags sold-out items). */
  refreshStock: () => Promise<void>;
  /** True while any item is sold out or exceeds the stock left. Blocks checkout. */
  hasUnavailableItems: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("stock");
  const locale = useLocale();
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const refreshStock = useCallback(() => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const run = (async () => {
      const current = getGuestCart();
      if (current.length === 0) return;
      try {
        const availability = await fetchAvailability(current.map((i) => i.variantId));
        // Re-read: the cart may have changed while the request was in flight.
        const { cart, reduced, soldOut } = applyAvailability(getGuestCart(), availability);
        saveGuestCart(cart);
        setItems(cart);
        const nameOf = (i: CartItem) => (locale === "ar" ? i.productNameAr : i.productNameEn);
        soldOut.forEach((i) => toast.error(t("itemSoldOut", { name: nameOf(i) })));
        reduced.forEach((i) =>
          toast.warning(t("quantityReduced", { name: nameOf(i), count: i.quantity })),
        );
      } catch (err) {
        // Network failure: keep the cart as is; the backend still re-checks
        // stock when the order is placed.
        console.error("Failed to refresh cart stock:", err);
      }
    })().finally(() => {
      refreshInFlight.current = null;
    });
    refreshInFlight.current = run;
    return run;
  }, [locale, t]);

  useEffect(() => {
    setItems(getGuestCart());
    setIsLoading(false);
    // Stock may have changed since the cart was saved (e.g. last visit).
    refreshStock();
  }, [refreshStock]);

  const openCart = useCallback(() => {
    setIsOpen(true);
    refreshStock();
  }, [refreshStock]);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const shopNow = useCallback(() => {
    setIsOpen(false);
    router.push("/collections/all-products");
  }, [router]);

  const addItem = useCallback((item: CartItem) => {
    const { cart, added } = addToGuestCart(item);
    setItems(cart);
    if (added === 0) {
      toast.error(
        item.stock === 0 ? t("outOfStockToast") : t("maxInCart", { count: item.stock ?? 0 }),
      );
      return 0;
    }
    if (added < item.quantity) {
      toast.warning(t("partialAdded", { count: added }));
    }
    setIsOpen(true); // Open cart drawer when item is added
    return added;
  }, [t]);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    const updatedCart = updateGuestCartQuantity(variantId, quantity);
    setItems(updatedCart);
  }, []);

  const removeItem = useCallback((variantId: string) => {
    const updatedCart = removeFromGuestCart(variantId);
    setItems(updatedCart);
  }, []);

  const clearCart = useCallback(() => {
    clearGuestCart();
    setItems([]);
  }, []);

  const itemCount = getCartItemCount(items);
  const total = getCartTotal(items);
  const hasUnavailableItems = items.some(isCartItemUnavailable);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        isLoading,
        isOpen,
        openCart,
        closeCart,
        shopNow,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshStock,
        hasUnavailableItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
