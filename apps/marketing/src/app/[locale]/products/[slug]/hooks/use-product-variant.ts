"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import type { UniqueColor, UniqueSize, SizeAvailability } from "../types";
import { getAvailableStock, isVariantInStock, firstInStockVariant, isColorSoldOut as colorSoldOut } from "@/lib/stock";

export function useProductVariant(product: Product) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial variant from URL params or default to first
  const getInitialVariant = useCallback((): ProductVariant | null => {
    const colorParam = searchParams.get("color");
    const sizeParam = searchParams.get("size");
    const variantParam = searchParams.get("variant");

    if (variantParam) {
      const variant = product.variants?.find((v) => v.slug === variantParam || v.id === variantParam);
      if (variant) return variant;
    }

    if (colorParam || sizeParam) {
      const variant = product.variants?.find((v) => {
        const colorMatch = !colorParam || v.color?.nameEn?.toLowerCase() === colorParam.toLowerCase();
        const sizeMatch = !sizeParam || v.size?.nameEn?.toLowerCase() === sizeParam.toLowerCase();
        return colorMatch && sizeMatch;
      });
      if (variant) return variant;
    }

    // No explicit choice in the URL: open on something that can be bought.
    return firstInStockVariant(product.variants);
  }, [product.variants, searchParams]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(getInitialVariant);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Update URL when variant changes
  const updateURL = useCallback(
    (variant: ProductVariant) => {
      const params = new URLSearchParams();
      if (variant.color?.nameEn) {
        params.set("color", variant.color.nameEn.toLowerCase());
      }
      if (variant.size?.nameEn) {
        params.set("size", variant.size.nameEn.toLowerCase());
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Get unique colors
  const uniqueColors: UniqueColor[] =
    product.variants
      ?.filter((v) => v.color)
      .reduce((acc, v) => {
        if (v.color && !acc.find((c) => c.id === v.color!.id)) {
          acc.push({ ...v.color, variantId: v.id });
        }
        return acc;
      }, [] as UniqueColor[]) ?? [];

  // Get unique sizes
  const uniqueSizes: UniqueSize[] =
    product.variants
      ?.filter((v) => v.size)
      .reduce((acc, v) => {
        if (v.size && !acc.find((s) => s.id === v.size!.id)) {
          acc.push({ ...v.size, variantId: v.id });
        }
        return acc;
      }, [] as UniqueSize[])
      .sort((a, b) => a.position - b.position) ?? [];

  // Get size availability for selected color
  const getSizeAvailability = useCallback(
    (sizeId: string): SizeAvailability => {
      const variant = product.variants?.find(
        (v) => v.size?.id === sizeId && (!selectedVariant?.color || v.color?.id === selectedVariant.color?.id)
      );
      if (!variant) return { available: false, inStock: false, stock: 0 };
      const stock = getAvailableStock(variant);
      return { available: true, inStock: stock > 0, stock };
    },
    [product.variants, selectedVariant?.color]
  );

  const handleColorSelect = useCallback(
    (colorId: string) => {
      // Prefer the same size in stock, then any in-stock variant of this
      // colour, then the same size even if sold out (so the page says so).
      const ofColor = product.variants?.filter((v) => v.color?.id === colorId) ?? [];
      const sameSize = (v: ProductVariant) => !selectedVariant?.size || v.size?.id === selectedVariant.size?.id;
      const variant =
        ofColor.find((v) => sameSize(v) && isVariantInStock(v)) ??
        ofColor.find(isVariantInStock) ??
        ofColor.find(sameSize) ??
        ofColor[0];
      if (variant) {
        setSelectedVariant(variant);
        setSelectedImageIndex(0);
        updateURL(variant);
      }
    },
    [product.variants, selectedVariant?.size, updateURL]
  );

  const handleSizeSelect = useCallback(
    (sizeId: string) => {
      const variant = product.variants?.find(
        (v) => v.size?.id === sizeId && (!selectedVariant?.color || v.color?.id === selectedVariant.color?.id)
      );
      if (variant) {
        setSelectedVariant(variant);
        updateURL(variant);
      }
    },
    [product.variants, selectedVariant?.color, updateURL]
  );

  const isColorSoldOut = useCallback(
    (colorId: string) => colorSoldOut(product.variants, colorId),
    [product.variants]
  );

  return {
    selectedVariant,
    isColorSoldOut,
    selectedImageIndex,
    setSelectedImageIndex,
    uniqueColors,
    uniqueSizes,
    getSizeAvailability,
    handleColorSelect,
    handleSizeSelect,
  };
}
