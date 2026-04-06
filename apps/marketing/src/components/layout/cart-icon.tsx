"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

export function CartIcon() {
  const { itemCount, openCart } = useCart();

  return (
    <button 
      onClick={openCart}
      className="relative p-2 hover:opacity-60 transition-opacity"
    >
      <ShoppingBag className="h-5 w-5 stroke-1" />
      {itemCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[8px] font-medium text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
