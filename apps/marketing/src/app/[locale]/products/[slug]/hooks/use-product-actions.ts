"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { useFavourites } from "@/contexts/favourites-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { createCartItemFromVariant } from "@/lib/cart";
import { trackQuickAddToCart, trackFavouriteToggle, trackWishlistToggle } from "@/lib/analytics";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { DEFAULT_QUANTITY, MIN_QUANTITY } from "../constants";

export function useProductActions(product: Product, locale: string) {
  const router = useRouter();
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const { favouriteIds, addFavourite, removeFavourite } = useFavourites();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => q + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(MIN_QUANTITY, q - 1));
  }, []);

  const handleAddToCart = useCallback(
    (selectedVariant: ProductVariant | null) => {
      if (!selectedVariant) return;
      const cartItem = createCartItemFromVariant(selectedVariant, product, quantity);
      addItem(cartItem);
      const productName = locale === "ar" ? product.nameAr : product.nameEn;
      trackQuickAddToCart(product.id, selectedVariant.id, productName, selectedVariant.price, quantity);
    },
    [addItem, product, quantity, locale]
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
      const params = new URLSearchParams({
        buyNow: "true",
        variantId: selectedVariant.id,
        quantity: String(quantity),
        productSlug: product.slug,
      });
      router.push(`/${locale}/checkout?${params.toString()}`);
    },
    [locale, product.slug, quantity, router]
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
