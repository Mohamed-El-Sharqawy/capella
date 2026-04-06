"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProductVariant } from "@ecommerce/shared-types";

interface FixedBottomBarProps {
  show: boolean;
  name: string;
  price: number;
  imageUrl?: string;
  selectedVariant: ProductVariant | null;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCart: () => void;
  locale: string;
}

export function FixedBottomBar({
  show,
  name,
  price,
  imageUrl,
  selectedVariant,
  quantity,
  onIncrement,
  onDecrement,
  onAddToCart,
  locale,
}: FixedBottomBarProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Product Image & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden relative shrink-0">
            {imageUrl && (
              <Image src={imageUrl} alt={name} fill className="object-cover" sizes="48px" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium truncate max-w-[200px]">{name}</p>
          </div>
        </div>

        {/* Right: Variant, Quantity, Price, Add to Cart */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-muted-foreground">
            {selectedVariant?.color &&
              (isArabic ? selectedVariant.color.nameAr : selectedVariant.color.nameEn)}
            {selectedVariant?.size &&
              ` / ${isArabic ? selectedVariant.size.nameAr : selectedVariant.size.nameEn}`}
            {" - "}
            <span className="font-semibold text-foreground">LE {price.toLocaleString()}</span>
          </div>

          {/* Quantity */}
          <div className="flex items-center border rounded">
            <button
              onClick={onDecrement}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button
              onClick={onIncrement}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={onAddToCart}
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition"
          >
            {t("addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
