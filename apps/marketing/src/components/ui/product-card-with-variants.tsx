"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Eye, ShoppingBag, Minus, Plus, Check, Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { useCart } from "@/contexts/cart-context";
import { createCartItemFromVariant } from "@/lib/cart";
import { trackQuickAddToCart } from "@/lib/analytics";
import { QuickViewModal } from "./quick-view-modal";
import { Badge } from "./badge";
import { TrendingUp, Star } from "lucide-react";

interface ProductCardWithVariantsProps {
  product: Product;
  locale: string;
}

export function ProductCardWithVariants({
  product,
  locale,
}: ProductCardWithVariantsProps) {
  const t = useTranslations("common");
  const { items: cartItems, addItem, updateQuantity } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = useMemo(() => {
    if (!selectedVariant) return null;
    return cartItems.find((item) => item.variantId === selectedVariant.id);
  }, [cartItems, selectedVariant]);

  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.nameEn;

  const price = selectedVariant?.price ?? 0;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const primaryImage = selectedVariant?.images?.[0]?.url;
  const hoverImage = selectedVariant?.images?.[1]?.url;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const uniqueColors = product.variants
    ?.filter((v) => v.color)
    .reduce((acc, v) => {
      if (v.color && !acc.find((c) => c.id === v.color!.id)) {
        acc.push({ ...v.color, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; hex: string; nameEn: string; nameAr: string; variantId: string }>)
    .slice(0, 8);

  const uniqueSizes = product.variants
    ?.filter((v) => v.size)
    .reduce((acc, v) => {
      if (v.size && !acc.find((s) => s.id === v.size!.id)) {
        acc.push({ ...v.size, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; nameEn: string; nameAr: string; position: number; variantId: string }>)
    .sort((a, b) => a.position - b.position);

  const handleColorHover = (colorId: string) => {
    const variant = product.variants?.find((v) => v.color?.id === colorId);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const handleSizeSelect = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    if (selectedVariant?.color?.id) {
      const matchingVariant = product.variants?.find(
        (v) =>
          v.color?.id === selectedVariant.color?.id && v.size?.id === sizeId
      );
      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
      }
    }
  };

  const handleQuickAdd = () => {
    if (!selectedVariant) return;

    let variantToAdd = selectedVariant;
    if (selectedSizeId && selectedVariant.size?.id !== selectedSizeId) {
      const matchingVariant = product.variants?.find(
        (v) =>
          v.color?.id === selectedVariant.color?.id &&
          v.size?.id === selectedSizeId
      );
      if (matchingVariant) {
        variantToAdd = matchingVariant;
      }
    }

    setIsAdding(true);
    const newCartItem = createCartItemFromVariant(variantToAdd, {
      id: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
    });
    addItem(newCartItem);
    trackQuickAddToCart(product.id, variantToAdd.id, name, variantToAdd.price, 1);

    setTimeout(() => {
      setIsAdding(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    }, 300);
  };

  const handleIncrement = () => {
    if (cartItem && selectedVariant) {
      updateQuantity(selectedVariant.id, cartItem.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem && selectedVariant) {
      updateQuantity(selectedVariant.id, cartItem.quantity - 1);
    }
  };

  return (
    <>
      <div
        className="group relative"
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => {
          setIsCardHovered(false);
          setSelectedSizeId(null);
        }}
      >
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200/40 bg-white transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] shadow-md hover:border-neutral-300/50">

          {/* Image Section */}
          <div
            className="relative"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            <Link href={`/products/${product.slug}`} className="block select-none" draggable={false}>
              <div draggable={false} className="relative overflow-hidden select-none" style={{ aspectRatio: '3/4' }}>
                {primaryImage ? (
                  <>
                    <Image draggable={false}
                      src={primaryImage}
                      alt={name}
                      fill
                      className={`object-cover select-none transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isImageHovered && hoverImage
                        ? "opacity-0 scale-105"
                        : "opacity-100 scale-100"
                        }`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {hoverImage && (
                      <Image draggable={false}
                        src={hoverImage}
                        alt={name}
                        fill
                        className={`object-cover select-none transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] pointer-events-none ${isImageHovered
                          ? "opacity-100 scale-[1.05]"
                          : "opacity-0 scale-100"
                          }`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center bg-neutral-50 text-neutral-300">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                )}
              </div>
            </Link>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
              {discountPercent && (
                <Badge variant="destructive" size="lg" className="shadow-lg border-none">
                  -{discountPercent}%
                </Badge>
              )}
              {product.isFeatured && (
                <Badge variant="luxury" size="lg" className="flex gap-1.5 items-center border-none shadow-xl">
                  <Star className="h-2.5 w-2.5 fill-[#B8860B] text-[#B8860B]" />
                  {t("featured")}
                </Badge>
              )}
              {product.isTrending && (
                <Badge variant="trending" size="lg" className="flex gap-1.5 items-center border-none shadow-md">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {t("trending")}
                </Badge>
              )}
              {product.badge === "NEW" && (
                <Badge variant="outline" size="lg" className="border-black/5 shadow-sm bg-white/90 backdrop-blur-sm">
                  {t("badges.new")}
                </Badge>
              )}
              {product.badge === "BESTSELLER" && (
                <Badge variant="outline" size="lg" className="border-black/5 shadow-sm bg-white/90 backdrop-blur-sm">
                  {t("badges.bestseller")}
                </Badge>
              )}
              {product.badge === "LIMITED_EDITION" && (
                <Badge variant="luxury" size="lg" className="bg-indigo-950 border-none shadow-xl">
                  {t("badges.limitedEdition")}
                </Badge>
              )}
            </div>

            {/* Hover Overlay with Quick Actions */}
            <div
              className={`hidden md:block absolute bottom-0 left-0 right-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isCardHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
                }`}
            >
              <div className="bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
                <div className="flex">
                  {cartItem ? (
                    <>
                      <div className="flex-1 flex items-center justify-center gap-1 py-3">
                        <button
                          onClick={handleDecrement}
                          className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer hover:bg-neutral-100 transition-all duration-200 active:scale-90"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums">{cartItem.quantity}</span>
                        <button
                          onClick={handleIncrement}
                          className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer hover:bg-neutral-100 transition-all duration-200 active:scale-90"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="border-l border-neutral-200" />
                      <Link
                        href="/checkout"
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-[0.15em] uppercase cursor-pointer bg-foreground text-background hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Checkout
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleQuickAdd}
                        disabled={isAdding}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-[0.15em] uppercase cursor-pointer bg-background text-foreground hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        {isAdding ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : justAdded ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5" />
                        )}
                        {isAdding ? "Adding..." : justAdded ? "Added" : "Quick Add"}
                      </button>

                      <div className="border-l border-neutral-200" />
                      <button
                        onClick={() => setIsQuickViewOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-[0.15em] uppercase cursor-pointer transition-all duration-200 bg-background text-foreground hover:bg-black hover:text-white active:scale-[0.98]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </>
                  )}
                </div>

                {uniqueSizes && uniqueSizes.length > 0 && (
                  <div className="flex justify-center gap-1.5 py-2.5 px-3">
                    {uniqueSizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => handleSizeSelect(size.id)}
                        className={`min-w-[32px] px-2 py-1 text-xs font-medium tracking-wider uppercase border rounded-md cursor-pointer transition-all duration-200 ${selectedSizeId === size.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                          }`}
                      >
                        {isArabic ? size.nameAr : size.nameEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <Link href={`/products/${product.slug}`} className="block">
            <div className="px-4 pt-3 pb-4 space-y-1.5">
              <h3 className="font-serif text-sm tracking-wide text-neutral-800 line-clamp-1 transition-colors duration-300 group-hover:text-neutral-950">
                {name}
              </h3>

              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-wide text-foreground">
                  AED {price.toLocaleString()}
                </span>
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-xs text-muted-foreground line-through">
                    AED {compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {uniqueColors && uniqueColors.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  {uniqueColors.map((color) => (
                    <button
                      key={color.id}
                      className={`h-9 w-9 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${selectedVariant?.color?.id === color.id
                        ? "ring-2 ring-luxury-gold/40 ring-offset-2 ring-offset-white"
                        : ""
                        }`}
                      onMouseEnter={() => handleColorHover(color.id)}
                      aria-label={isArabic ? color.nameAr : color.nameEn}
                    >
                      <span
                        className={`h-4 w-4 rounded-full border transition-all ${selectedVariant?.color?.id === color.id
                          ? "border-luxury-gold"
                          : "border-neutral-300/80"
                          }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Link>
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
