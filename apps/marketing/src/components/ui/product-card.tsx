"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import type { Product } from "@ecommerce/shared-types";

import { useTranslations } from "next-intl";
import { Badge } from "./badge";
import { Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  locale: string;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations("common");
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.nameEn;
  const subtitle = isArabic ? product.material?.nameAr : product.material?.nameEn;

  const defaultVariant = product.variants?.[0];
  const prices = product.variants?.[0] ? {
    price: product.variants[0].price,
    compareAtPrice: product.variants[0].compareAtPrice
  } : { price: 0, compareAtPrice: null };

  const { price, compareAtPrice } = prices;
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
      <div className="relative aspect-3/4 overflow-hidden bg-neutral-50">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage}
              alt={name}
              fill
              className={`object-contain transition-all duration-700 ${isHovered && hoverImage ? "opacity-0" : "opacity-100"
                } ${isHovered ? "scale-110" : "scale-100"}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={name}
                fill
                className={`object-contain transition-all duration-700 ${isHovered ? "opacity-100 scale-110" : "opacity-0 scale-100"
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

        {/* Badges Stack */}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10 pointer-events-none">
          {discountPercent && (
            <Badge variant="destructive" size="sm" className="shadow-lg border-none">
              -{discountPercent}%
            </Badge>
          )}

          {product.isFeatured && (
            <Badge variant="secondary" size="sm" className="flex items-center border-none shadow-sm p-1.5 bg-white/90 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-[#B8860B] text-[#B8860B]" />
            </Badge>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-4 right-4 p-2.5 transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-black text-black" : "text-black/40 hover:text-black"
              }`}
          />
        </button>
      </div>

      <div className="mt-6 text-center space-y-1.5 px-2">
        <h3 className="text-xs md:text-sm font-medium uppercase group-hover:opacity-60 transition-opacity" style={{ letterSpacing: isArabic ? "0em" : "0.15em" }}>
          {name}
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {subtitle}
          </p>
        )}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold text-foreground" style={{ letterSpacing: isArabic ? "0em" : "0.025em" }}>
            AED {price.toLocaleString()}
          </span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-[10px] text-muted-foreground line-through" style={{ letterSpacing: isArabic ? "0em" : "0.05em" }}>
              AED {compareAtPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
