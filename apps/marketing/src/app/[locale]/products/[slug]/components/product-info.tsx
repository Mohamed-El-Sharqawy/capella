"use client";

import { Star, Minus, Plus, Heart, Bookmark, Check, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProductVariant } from "@ecommerce/shared-types";
import type { UniqueColor, UniqueSize, SizeAvailability } from "../types";

interface CartItemInfo {
  variantId: string;
  quantity: number;
}

interface ProductInfoProps {
  name: string;
  price: number;
  compareAtPrice?: number | null;
  discountPercent: number | null;
  reviewCount: number;
  locale: string;
  // Variant selection
  uniqueColors: UniqueColor[];
  uniqueSizes: UniqueSize[];
  selectedVariant: ProductVariant | null;
  onColorSelect: (colorId: string) => void;
  onSizeSelect: (sizeId: string) => void;
  getSizeAvailability: (sizeId: string) => SizeAvailability;
  hasSizeGuide: boolean;
  onOpenSizeGuide: () => void;
  // Quantity
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  // Actions
  onAddToCart: () => void;
  onBuyNow: () => void;
  isFavourite: boolean;
  isInWishlist: boolean;
  onToggleFavourite: () => void;
  onToggleWishlist: () => void;
  // Cart state
  cartItem: CartItemInfo | null;
  onUpdateCartQuantity: (variantId: string, quantity: number) => void;
}

export function ProductInfo({
  name,
  price,
  compareAtPrice,
  discountPercent,
  reviewCount,
  locale,
  uniqueColors,
  uniqueSizes,
  selectedVariant,
  onColorSelect,
  onSizeSelect,
  getSizeAvailability,
  hasSizeGuide,
  onOpenSizeGuide,
  quantity,
  onIncrement,
  onDecrement,
  onAddToCart,
  onBuyNow,
  isFavourite,
  isInWishlist,
  onToggleFavourite,
  onToggleWishlist,
  cartItem,
  onUpdateCartQuantity,
}: ProductInfoProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";
  const isInCart = !!cartItem;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">{name}</h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {reviewCount} {t("reviews")}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-red-600">LE {price.toLocaleString()}</span>
          {compareAtPrice && compareAtPrice > price && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                LE {compareAtPrice.toLocaleString()}
              </span>
              <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                {discountPercent}% {t("off")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Color Selection */}
      {uniqueColors.length > 0 && (
        <div>
          <p className="text-sm mb-2">
            <span className="font-medium">{t("color")}:</span>{" "}
            <span>{isArabic ? selectedVariant?.color?.nameAr : selectedVariant?.color?.nameEn}</span>
          </p>
          <div className="flex gap-2">
            {uniqueColors.map((color) => (
              <button
                key={color.id}
                onClick={() => onColorSelect(color.id)}
                className={`w-8 h-8 rounded-full border-2 transition ${
                  selectedVariant?.color?.id === color.id
                    ? "border-black ring-2 ring-offset-2 ring-black"
                    : "border-gray-300 hover:border-gray-500"
                }`}
                style={{ backgroundColor: color.hex }}
                title={isArabic ? color.nameAr : color.nameEn}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {uniqueSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm">
              <span className="font-medium">{t("size")}:</span>{" "}
              <span>{isArabic ? selectedVariant?.size?.nameAr : selectedVariant?.size?.nameEn}</span>
            </p>
            <button
              onClick={onOpenSizeGuide}
              className={`text-sm underline ${!hasSizeGuide ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!hasSizeGuide}
            >
              {t("sizeGuide")}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {uniqueSizes.map((size) => {
              const { available, inStock } = getSizeAvailability(size.id);
              const isSelected = selectedVariant?.size?.id === size.id;
              const isDisabled = !available;
              const isOutOfStock = available && !inStock;

              return (
                <button
                  key={size.id}
                  onClick={() => !isDisabled && onSizeSelect(size.id)}
                  disabled={isDisabled}
                  className={`relative min-w-[48px] px-4 py-2 border rounded text-sm font-medium transition ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : isDisabled
                      ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                      : isOutOfStock
                      ? "border-gray-300 text-gray-400 line-through"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  {isArabic ? size.nameAr : size.nameEn}
                  {isOutOfStock && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-sm font-medium mb-2">{t("quantity")}</p>
        <div className="flex items-center border rounded w-fit">
          <button
            onClick={onDecrement}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={onIncrement}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Favourite & Wishlist */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={onToggleFavourite}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded transition ${
            isFavourite
              ? "border-red-500 text-red-500 bg-red-50"
              : "border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500"
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavourite ? "fill-current" : ""}`} />
          {t("favourite")}
        </button>
        <button
          onClick={onToggleWishlist}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded transition ${
            isInWishlist
              ? "border-blue-500 text-blue-500 bg-blue-50"
              : "border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500"
          }`}
        >
          <Bookmark className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
          {t("wishlist")}
        </button>
      </div>

      {/* Add to Cart & Buy Now */}
      <div className="space-y-3">
        {isInCart ? (
          // Show quantity controls when item is in cart
          <div className="flex items-center gap-3">
            <div className="flex items-center border-2 border-black rounded flex-1">
              <button
                onClick={() => onUpdateCartQuantity(cartItem.variantId, cartItem.quantity - 1)}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center font-semibold text-lg">{cartItem.quantity}</span>
              <button
                onClick={() => onUpdateCartQuantity(cartItem.variantId, cartItem.quantity + 1)}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 px-6 h-12 bg-black text-white font-semibold rounded hover:bg-gray-800 transition"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("checkout")}
            </Link>
          </div>
        ) : (
          <button
            onClick={onAddToCart}
            className="w-full py-3 border-2 border-black text-black font-semibold rounded hover:bg-gray-100 transition"
          >
            {t("addToCart")} - LE {(price * quantity).toLocaleString()}
          </button>
        )}
        <button
          onClick={onBuyNow}
          className="w-full py-3 bg-black text-white font-semibold rounded hover:bg-gray-800 transition"
        >
          {t("buyNow")}
        </button>
      </div>
    </div>
  );
}
