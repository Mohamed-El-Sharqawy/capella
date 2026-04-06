"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@ecommerce/shared-types";
import { apiPost } from "@/lib/api-client";
import { SUGGESTED_PRODUCTS_LIMIT } from "../constants";

interface CartItem {
  productId: string;
  collectionId?: string;
}

export function useSuggestedProducts(items: CartItem[]) {
  // Memoize the IDs to prevent unnecessary refetches
  const { collectionIds, excludeProductIds } = useMemo(() => ({
    collectionIds: [...new Set(items.map((item) => item.collectionId).filter(Boolean))] as string[],
    excludeProductIds: items.map((item) => item.productId).filter(Boolean) as string[],
  }), [items]);

  const { data: suggestedProducts = [] } = useQuery({
    queryKey: ["cart-suggested-products", collectionIds, excludeProductIds],
    queryFn: async () => {
      const response = await apiPost<{ data: Product[] }>("/api/products/related", {
        collectionIds,
        excludeProductIds,
        limit: SUGGESTED_PRODUCTS_LIMIT,
      });
      return response.data || [];
    },
    enabled: items.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return suggestedProducts;
}
