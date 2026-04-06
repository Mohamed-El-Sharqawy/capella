"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trackCartRemove } from "@/lib/analytics";
import type { CartItemRowProps } from "../types";

export function CartItemRow({ item, locale, onClose, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const t = useTranslations("cartDrawer");
  const isArabic = locale === "ar";

  return (
    <div className="flex gap-4">
      <Link href={`/products/${item.productSlug}`} onClick={onClose} className="shrink-0">
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

      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.productSlug}`}
          onClick={onClose}
          className="font-medium text-sm hover:underline line-clamp-2"
        >
          {isArabic ? item.productNameAr : item.productNameEn}
        </Link>
        <p className="text-xs text-muted-foreground mt-1">
          {item.colorNameEn && (isArabic ? item.colorNameAr : item.colorNameEn)}
          {item.sizeNameEn && ` / ${isArabic ? item.sizeNameAr : item.sizeNameEn}`}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {item.compareAtPrice && item.compareAtPrice > item.price && (
            <span className="text-xs text-muted-foreground line-through">
              LE {item.compareAtPrice.toLocaleString()}
            </span>
          )}
          <span className="text-sm font-semibold text-red-600">
            LE {item.price.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border rounded">
            <button
              onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.variantId);
              const productName = isArabic ? item.productNameAr : item.productNameEn;
              trackCartRemove(item.productId, item.variantId, productName, item.price);
            }}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
