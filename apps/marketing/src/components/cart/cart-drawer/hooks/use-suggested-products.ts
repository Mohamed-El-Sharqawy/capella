"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import type { SuggestedProduct } from "../types";
import { SUGGESTED_PRODUCTS_LIMIT } from "../constants";

export function useSuggestedProducts(items: any[], isOpen: boolean) {
  // Memoize the IDs to prevent unnecessary refetches
  const { collectionIds, excludeProductIds } = useMemo(() => ({
    collectionIds: [...new Set(items.map((item) => item.collectionId).filter(Boolean))] as string[],
    excludeProductIds: items.map((item) => item.productId).filter(Boolean) as string[],
  }), [items]);

  const { data: suggestedProducts = [] } = useQuery({
    queryKey: ["suggested-products", collectionIds, excludeProductIds],
    queryFn: async () => {
      const response = await apiPost<{ data: SuggestedProduct[] }>("/api/products/related", {
        collectionIds,
        excludeProductIds,
        limit: SUGGESTED_PRODUCTS_LIMIT,
      });
      return response.data || [];
    },
    enabled: isOpen && items.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return suggestedProducts;
}
