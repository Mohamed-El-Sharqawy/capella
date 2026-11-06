"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { useFavourites } from "@/contexts/favourites-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { createCartItemFromVariant } from "@/lib/cart";
import { getAvailableStock } from "@/lib/stock";
import { trackQuickAddToCart, trackFavouriteToggle, trackWishlistToggle } from "@/lib/analytics";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { DEFAULT_QUANTITY, MIN_QUANTITY } from "../constants";

export function useProductActions(
  product: Product,
  locale: string,
  selectedVariant: ProductVariant | null = null,
) {
  const router = useRouter();
  const tStock = useTranslations("stock");
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const { favouriteIds, addFavourite, removeFavourite } = useFavourites();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  // Never let the quantity picker go above what's in stock.
  const availableStock = getAvailableStock(selectedVariant);
  const maxQuantity = Math.max(MIN_QUANTITY, availableStock);

  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQuantity));
  }, [maxQuantity]);

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => Math.min(maxQuantity, q + 1));
  }, [maxQuantity]);

  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(MIN_QUANTITY, q - 1));
  }, []);

  const handleAddToCart = useCallback(
    (selectedVariant: ProductVariant | null) => {
      if (!selectedVariant) return;
      if (getAvailableStock(selectedVariant) <= 0) {
        toast.error(tStock("outOfStockToast"));
        return;
      }
      const cartItem = createCartItemFromVariant(selectedVariant, product, quantity);
      const added = addItem(cartItem);
      if (added === 0) return;
      const productName = locale === "ar" ? product.nameAr : product.nameEn;
      trackQuickAddToCart(product.id, selectedVariant.id, productName, selectedVariant.price, added, selectedVariant.sku);
    },
    [addItem, product, quantity, locale, tStock]
  );

  // Get cart item for selected variant
  const getCartItem = useCallback(
    (variantId: string | null) => {
      if (!variantId) return null;
      return cartItems.find((item) => item.variantId === variantId) || null;
    },
    [cartItems]
  );

  // Update cart quantity for a variant
  const updateCartQuantity = useCallback(
    (variantId: string, newQuantity: number) => {
      updateQuantity(variantId, newQuantity);
    },
    [updateQuantity]
  );

  const handleBuyNow = useCallback(
    (selectedVariant: ProductVariant | null) => {
      if (!selectedVariant) return;
      if (getAvailableStock(selectedVariant) < quantity) {
        toast.error(tStock("buyNowUnavailable"));
        return;
      }
      const params = new URLSearchParams({
        buyNow: "true",
        variantId: selectedVariant.id,
        quantity: String(quantity),
        productSlug: product.slug,
      });
      router.push(`/${locale}/checkout?${params.toString()}`);
    },
    [locale, product.slug, quantity, router, tStock]
  );

  const isFavourite = favouriteIds.includes(product.id);
  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);

  const toggleFavourite = useCallback(() => {
    if (isFavourite) {
      removeFavourite(product.id);
      trackFavouriteToggle(product.id, "remove");
    } else {
      addFavourite(product.id);
      trackFavouriteToggle(product.id, "add");
    }
  }, [addFavourite, isFavourite, product.id, removeFavourite]);

  const toggleWishlist = useCallback(() => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
      trackWishlistToggle(product.id, "remove");
    } else {
      addToWishlist(product.id);
      trackWishlistToggle(product.id, "add");
    }
  }, [addToWishlist, isInWishlist, product.id, removeFromWishlist]);

  return {
    quantity,
    setQuantity,
    availableStock,
    maxQuantity,
    incrementQuantity,
    decrementQuantity,
    handleAddToCart,
    handleBuyNow,
    isFavourite,
    isInWishlist,
    toggleFavourite,
    toggleWishlist,
    getCartItem,
    updateCartQuantity,
    cartItems,
  };
}
