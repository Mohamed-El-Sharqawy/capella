"use client";

import Image from "next/image";
import { Trash2, Minus, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { CartItemDisplayProps } from "../types";

export function CartItem({ item, locale, onRemove, onUpdateQuantity }: CartItemDisplayProps) {
  const t = useTranslations("cart");
  const isArabic = locale === "ar";

  return (
    <div className="py-6 grid grid-cols-12 gap-4 items-center">
      {/* Product Info */}
      <div className="col-span-12 md:col-span-6 flex gap-4">
        <Link href={`/products/${item.productSlug}`} className="shrink-0">
          <div className="w-20 h-24 bg-gray-100 rounded overflow-hidden relative">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={isArabic ? item.productNameAr : item.productNameEn}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                {t("noImage")}
              </div>
            )}
          </div>
        </Link>
        <div>
          <Link
            href={`/products/${item.productSlug}`}
            className="font-medium hover:underline"
          >
            {isArabic ? item.productNameAr : item.productNameEn}
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {item.colorNameEn && (isArabic ? item.colorNameAr : item.colorNameEn)}
            {item.sizeNameEn && ` / ${isArabic ? item.sizeNameAr : item.sizeNameEn}`}
          </p>
          <button
            onClick={() => onRemove(item.variantId)}
            className="text-sm text-red-600 hover:underline mt-2 flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            {t("remove")}
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="col-span-4 md:col-span-2 text-center">
        <div className="flex flex-col items-center gap-1">
          {item.compareAtPrice && item.compareAtPrice > item.price && (
            <span className="text-xs text-muted-foreground line-through">
              LE {item.compareAtPrice.toLocaleString()}
            </span>
          )}
          <span className="font-medium text-red-600">
            LE {item.price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Quantity */}
      <div className="col-span-4 md:col-span-2 flex justify-center">
        <div className="flex items-center border rounded">
          <button
            onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-10 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="col-span-4 md:col-span-2 text-right font-medium">
        LE {(item.price * item.quantity).toLocaleString()}
      </div>
    </div>
  );
}
