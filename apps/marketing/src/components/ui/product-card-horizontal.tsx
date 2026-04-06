"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heart, Eye } from "lucide-react";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { useCart } from "@/contexts/cart-context";
import { createCartItemFromVariant } from "@/lib/cart";
import { QuickViewModal } from "./quick-view-modal";

interface ProductCardHorizontalProps {
  product: Product;
  locale: string;
}

export function ProductCardHorizontal({
  product,
  locale,
}: ProductCardHorizontalProps) {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.nameEn;
  const description = isArabic
    ? product.shortDescriptionAr || product.descriptionAr
    : product.shortDescriptionEn || product.descriptionEn;

  const price = selectedVariant?.price ?? 0;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const primaryImage = selectedVariant?.images?.[0]?.url;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Get unique colors from variants
  const uniqueColors = product.variants
    ?.filter((v) => v.color)
    .reduce((acc, v) => {
      if (v.color && !acc.find((c) => c.id === v.color!.id)) {
        acc.push({ ...v.color, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; hex: string; nameEn: string; nameAr: string; variantId: string }>)
    .slice(0, 8);

  // Get unique sizes from variants
  const uniqueSizes = product.variants
    ?.filter((v) => v.size)
    .reduce((acc, v) => {
      if (v.size && !acc.find((s) => s.id === v.size!.id)) {
        acc.push({ ...v.size, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; nameEn: string; nameAr: string; position: number; variantId: string }>)
    .sort((a, b) => a.position - b.position);

  const handleColorClick = (colorId: string) => {
    const variant = product.variants?.find((v) => v.color?.id === colorId);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const handleSizeSelect = (sizeId: string) => {
    setSelectedSizeId(sizeId === selectedSizeId ? null : sizeId);
  };

  return (
    <>
      <div className={`flex gap-8 py-8 border-b ${isArabic ? "flex-row-reverse" : ""}`}>
        {/* Image */}
        <Link href={`/products/${product.slug}`} className="relative w-1/3 max-w-[300px] shrink-0">
          <div className="relative aspect-3/4 bg-neutral-100">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={name}
                fill
                className="object-cover"
                sizes="300px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            {discountPercent && (
              <span className="absolute top-3 left-3 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                -{discountPercent}%
              </span>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className={`flex-1 ${isArabic ? "text-right" : ""}`}>
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-lg font-medium hover:underline">{name}</h3>
          </Link>

          {/* Price */}
          <div className="flex items-center gap-2 mt-1">
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                LE {compareAtPrice.toLocaleString()}
              </span>
            )}
            <span className="text-sm font-semibold text-red-600">
              LE {price.toLocaleString()}
            </span>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {description}
            </p>
          )}

          {/* Colors */}
          {uniqueColors && uniqueColors.length > 0 && (
            <div className="flex gap-2 mt-4">
              {uniqueColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorClick(color.id)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedVariant?.color?.id === color.id
                      ? "border-black ring-1 ring-black ring-offset-1"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  aria-label={isArabic ? color.nameAr : color.nameEn}
                />
              ))}
            </div>
          )}

          {/* Sizes */}
          {uniqueSizes && uniqueSizes.length > 0 && (
            <div className="flex gap-2 mt-4">
              {uniqueSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => handleSizeSelect(size.id)}
                  className={`min-w-[36px] px-2 py-1.5 text-xs font-medium border rounded transition ${
                    selectedSizeId === size.id
                      ? "bg-black text-white border-black"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  {isArabic ? size.nameAr : size.nameEn}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              className="p-2 border rounded hover:bg-gray-100 transition"
              aria-label="Add to wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsQuickViewOpen(true)}
              className="p-2 border rounded hover:bg-gray-100 transition"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <QuickViewModal
        product={product}
        locale={locale}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
