"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { BuyNowItem } from "../types";

export function useBuyNow() {
  const searchParams = useSearchParams();

  const isBuyNow = searchParams.get("buyNow") === "true";
  const buyNowVariantId = searchParams.get("variantId");
  const buyNowQuantity = parseInt(searchParams.get("quantity") || "1", 10);
  const buyNowProductSlug = searchParams.get("productSlug");

  const { data: buyNowItem, isLoading: isBuyNowLoading } = useQuery({
    queryKey: ["buyNowProduct", buyNowVariantId, buyNowProductSlug],
    queryFn: async (): Promise<BuyNowItem> => {
      if (!buyNowProductSlug) throw new Error("No product slug");
      const response = await apiGet<{ data: any }>(`/api/products/${buyNowProductSlug}`);
      const product = response.data;
      const variant = product?.variants?.find((v: any) => v.id === buyNowVariantId);
      if (!variant) throw new Error("Variant not found");

      return {
        variantId: variant.id,
        productId: product.id,
        quantity: buyNowQuantity,
        productNameEn: product.nameEn,
        productNameAr: product.nameAr,
        variantNameEn: variant.nameEn,
        variantNameAr: variant.nameAr,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        imageUrl: variant.images?.[0]?.url,
        colorNameEn: variant.color?.nameEn,
        colorNameAr: variant.color?.nameAr,
        sizeNameEn: variant.size?.nameEn,
        sizeNameAr: variant.size?.nameAr,
      };
    },
    enabled: isBuyNow && !!buyNowVariantId && !!buyNowProductSlug,
  });

  return {
    isBuyNow,
    buyNowItem,
    isBuyNowLoading,
  };
}
