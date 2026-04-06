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
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 rounded-sm">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage}
              alt={name}
              fill
              className={`object-cover transition-all duration-700 ${
                isHovered && hoverImage ? "opacity-0" : "opacity-100"
              } ${isHovered ? "scale-110" : "scale-100"}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={name}
                fill
                className={`object-cover transition-all duration-700 ${
                  isHovered ? "opacity-100 scale-110" : "opacity-0 scale-100"
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground bg-neutral-100">
            No Image
          </div>
        )}

        {/* Badge Label */}
        {badgeLabel && (
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-black">
            {isArabic ? badgeLabel.ar : badgeLabel.en}
          </span>
        )}

        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-4 right-4 p-2 transition-all duration-300 opacity-0 group-hover:opacity-100"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "fill-black text-black" : "text-black/40 hover:text-black"
            }`}
          />
        </button>
      </div>

      <div className="mt-6 text-center space-y-1.5 px-2">
        <h3 className="text-[11px] md:text-xs font-medium uppercase tracking-[0.15em] line-clamp-1 group-hover:opacity-60 transition-opacity">
          {name}
        </h3>
        <div className="flex flex-col items-center gap-0.5">
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-[10px] text-muted-foreground line-through tracking-wider">
              AED {compareAtPrice.toLocaleString()}
            </span>
          )}
          <span className="text-xs font-semibold tracking-widest text-black">
            AED {price.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
