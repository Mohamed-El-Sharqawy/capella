"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type CartItem,
  getGuestCart,
  addToGuestCart,
  updateGuestCartQuantity,
  removeFromGuestCart,
  clearGuestCart,
  getCartItemCount,
  getCartTotal,
} from "@/lib/cart";
import { useRouter } from "next/navigation";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  shopNow: () => void;
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

  useEffect(() => {
    setItems(getGuestCart());
    setIsLoading(false);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const shopNow = useCallback(() => {
    setIsOpen(false);
    router.push("/collections/all-products");
  }, [router]);

  const addItem = useCallback((item: CartItem) => {
    const updatedCart = addToGuestCart(item);
    setItems(updatedCart);
    setIsOpen(true); // Open cart drawer when item is added
  }, []);

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
