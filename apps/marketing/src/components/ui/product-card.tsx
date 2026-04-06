"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import type { Product, ProductBadge } from "@ecommerce/shared-types";

interface ProductCardProps {
  product: Product;
  locale: string;
}

const BADGE_LABELS: Record<ProductBadge, { en: string; ar: string }> = {
  NEW: { en: "New", ar: "جديد" },
  BESTSELLER: { en: "Bestseller", ar: "الأكثر مبيعاً" },
  LIMITED_EDITION: { en: "Limited Edition", ar: "إصدار محدود" },
};

export function ProductCard({ product, locale }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.nameEn;

  const defaultVariant = product.variants?.[0];
  const price = defaultVariant?.price ?? 0;
  const compareAtPrice = defaultVariant?.compareAtPrice;
  const primaryImage = defaultVariant?.images?.[0]?.url;
  const hoverImage = defaultVariant?.images?.[1]?.url;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const colors = product.variants
    ?.map((v) => v.color?.hex)
    .filter((c, i, arr) => c && arr.indexOf(c) === i)
    .slice(0, 6);

  const badgeLabel = product.badge ? BADGE_LABELS[product.badge] : null;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    // TODO: Integrate with useFavourites hook when available
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-337/505 overflow-hidden bg-neutral-100">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage}
              alt={name}
              fill
              className={`object-cover transition-all duration-500 ${
                isHovered && hoverImage ? "opacity-0" : "opacity-100"
              } ${isHovered ? "scale-105" : "scale-100"}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={name}
                fill
                className={`object-cover transition-all duration-500 ${
                  isHovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Badge Label */}
        {badgeLabel && (
          <span className="absolute top-3 left-3 rounded-full bg-luxury-black px-3 py-1 text-xs font-medium text-white">
            {isArabic ? badgeLabel.ar : badgeLabel.en}
          </span>
        )}

        {/* Discount Badge */}
        {discountPercent && (
          <span className="absolute top-3 right-3 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute bottom-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-white ${
            isWishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium line-clamp-1">{name}</h3>
        <div className="flex items-center gap-2">
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              AED {compareAtPrice.toLocaleString()}
            </span>
          )}
          <span className="text-sm font-semibold text-red-600">
            AED {price.toLocaleString()}
          </span>
        </div>

        {colors && colors.length > 0 && (
          <div className="flex gap-1 pt-1">
            {colors.map((color, i) => (
              <span
                key={i}
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
