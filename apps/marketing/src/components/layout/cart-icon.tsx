"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

export function CartIcon() {
  const { itemCount, openCart } = useCart();

  return (
    <button 
      onClick={openCart}
      className="relative p-2 hover:opacity-70 transition-opacity"
    >
      <ShoppingBag className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
