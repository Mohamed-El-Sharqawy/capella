"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";

export function CartIcon({ isArabic }: { isArabic: boolean }) {
  const { itemCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className="relative p-2 hover:opacity-60 transition-opacity"
    >
      <ShoppingBag className="h-5 w-5 stroke-1" />
      {itemCount > 0 && (
        <span className={cn("absolute top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[8px] font-medium text-white", isArabic ? "left-0.5" : "right-0")}>
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
