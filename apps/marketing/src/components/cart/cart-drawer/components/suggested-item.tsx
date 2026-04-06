"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SuggestedItemProps } from "../types";

export function SuggestedItem({ product, locale, onClose }: SuggestedItemProps) {
  const isArabic = locale === "ar";
  const variant = product.variants?.[0];
  const imageUrl = variant?.images?.[0]?.url;

  return (
    <div className="border rounded-lg p-3 hover:shadow-md transition">
      <Link href={`/products/${product.slug}`} onClick={onClose}>
        <div className="aspect-3/4 bg-gray-100 rounded overflow-hidden relative mb-2">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={isArabic ? product.nameAr : product.nameEn}
              fill
              className="object-cover"
              sizes="150px"
            />
          )}
        </div>
      </Link>
      <Link
        href={`/products/${product.slug}`}
        onClick={onClose}
        className="text-sm font-medium hover:underline line-clamp-2"
      >
        {isArabic ? product.nameAr : product.nameEn}
      </Link>
      <div className="flex items-center gap-2 mt-1">
        {variant?.compareAtPrice && variant.compareAtPrice > variant.price && (
          <span className="text-xs text-muted-foreground line-through">
            LE {variant.compareAtPrice.toLocaleString()}
          </span>
        )}
        <span className="text-sm font-semibold text-red-600">
          LE {variant?.price?.toLocaleString()}
        </span>
      </div>
      <Link
        href={`/products/${product.slug}`}
        onClick={onClose}
        className="mt-2 w-full py-1.5 border border-black text-black text-xs rounded hover:bg-black hover:text-white transition flex items-center justify-center gap-1"
      >
        <Eye className="h-3 w-3" />
        {isArabic ? "عرض" : "View"}
      </Link>
    </div>
  );
}
