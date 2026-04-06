"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Eye, ShoppingBag, Heart, Bookmark, Minus, Plus, Check, Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { useCart } from "@/contexts/cart-context";
import { useFavourites } from "@/contexts/favourites-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { createCartItemFromVariant } from "@/lib/cart";
import { trackQuickAddToCart, trackFavouriteToggle, trackWishlistToggle } from "@/lib/analytics";
import { QuickViewModal } from "./quick-view-modal";

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
  const { favouriteIds, addFavourite, removeFavourite } = useFavourites();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  const isFavourite = favouriteIds.includes(product.id);
  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Check if current variant is in cart
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

  const handleColorHover = (colorId: string) => {
    const variant = product.variants?.find((v) => v.color?.id === colorId);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const handleSizeSelect = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    // Find variant with current color and selected size
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

    // Ensure we have a variant with the selected size
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
    
    // Show success state briefly
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
        <div
          className="relative"
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
        >
          <Link href={`/products/${product.slug}`} className="block select-none" draggable={false}>
            <div draggable={false} className="relative aspect-337/505 overflow-hidden bg-neutral-100 select-none">
              {primaryImage ? (
                <>
                  <Image draggable={false}
                    src={primaryImage}
                    alt={name}
                    fill
                    className={`object-cover select-none transition-all duration-700 ease-out rounded-xl ${
                      isImageHovered && hoverImage
                        ? "opacity-0 blur-sm scale-105"
                        : "opacity-100 blur-0 scale-100"
                    }`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {hoverImage && (
                    <Image draggable={false}
                      src={hoverImage}
                      alt={name}
                      fill
                      className={`object-cover select-none transition-all duration-1000 ease-out pointer-events-none ${
                        isImageHovered
                          ? "opacity-100 blur-0 scale-110"
                          : "opacity-0 blur-md scale-100"
                      }`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  )}
                </>
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

              {/* Favourite & Wishlist Buttons */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isFavourite) {
                      removeFavourite(product.id);
                      trackFavouriteToggle(product.id, "remove");
                    } else {
                      addFavourite(product.id);
                      trackFavouriteToggle(product.id, "add");
                    }
                  }}
                  className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition hover:scale-110 ${
                    isFavourite ? "text-red-500" : "text-gray-600 hover:text-red-500"
                  }`}
                  aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
                >
                  <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isInWishlist) {
                      removeFromWishlist(product.id);
                      trackWishlistToggle(product.id, "remove");
                    } else {
                      addToWishlist(product.id);
                      trackWishlistToggle(product.id, "add");
                    }
                  }}
                  className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition hover:scale-110 ${
                    isInWishlist ? "text-blue-500" : "text-gray-600 hover:text-blue-500"
                  }`}
                  aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Bookmark className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
          </Link>

          {/* Hover Overlay with Quick Actions - Hidden on mobile, visible on tablets and up */}
          <div
            className={`hidden md:block absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm transition-all duration-300 ${
              isCardHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            {/* Quick Action Buttons */}
            <div className="flex border-b">
              {cartItem ? (
                // Show quantity controls when item is in cart
                <>
                  <div className="flex-1 flex items-center justify-center gap-1 py-2 border-r">
                    <button
                      onClick={handleDecrement}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition active:scale-95"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{cartItem.quantity}</span>
                    <button
                      onClick={handleIncrement}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Link
                    href="/checkout"
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    CHECKOUT
                  </Link>
                </>
              ) : (
                // Show quick add button when not in cart
                <>
                  <button
                    onClick={handleQuickAdd}
                    disabled={isAdding}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium hover:bg-gray-100 transition border-r disabled:opacity-50"
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : justAdded ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                    {isAdding ? "ADDING..." : justAdded ? "ADDED!" : "QUICK ADD"}
                  </button>
                  <button
                    onClick={() => setIsQuickViewOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium hover:bg-gray-100 transition"
                  >
                    <Eye className="h-4 w-4" />
                    QUICK VIEW
                  </button>
                </>
              )}
            </div>

            {/* Size Selector */}
            {uniqueSizes && uniqueSizes.length > 0 && (
              <div className="flex justify-center gap-2 py-3 px-2">
                {uniqueSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleSizeSelect(size.id)}
                    className={`min-w-[36px] px-2 py-1.5 text-xs font-medium border rounded transition ${
                      selectedSizeId === size.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {isArabic ? size.nameAr : size.nameEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-sm font-medium line-clamp-1 hover:underline">
              {name}
            </h3>
          </Link>
          <div className="flex items-center gap-2">
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                LE {compareAtPrice.toLocaleString()}
              </span>
            )}
            <span className="text-sm font-semibold text-red-600">
              LE {price.toLocaleString()}
            </span>
          </div>

          {uniqueColors && uniqueColors.length > 0 && (
            <div className="flex gap-1 pt-1">
              {uniqueColors.map((color) => (
                <button
                  key={color.id}
                  className={`h-4 w-4 rounded-full border transition-transform hover:scale-125 ${
                    selectedVariant?.color?.id === color.id
                      ? "border-primary ring-1 ring-primary ring-offset-1"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  onMouseEnter={() => handleColorHover(color.id)}
                  aria-label={isArabic ? color.nameAr : color.nameEn}
                />
              ))}
            </div>
          )}
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
