"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Product } from "@ecommerce/shared-types";
import { apiGet } from "@/lib/api-client";
import { PRODUCTS_PER_PAGE, SORT_OPTIONS_DATA } from "../constants";
import type { ProductMeta } from "../types";

interface UseCollectionProductsOptions {
  slug: string;
  initialProducts: Product[];
  initialMeta: ProductMeta;
  sortOption: string;
  debouncedMinPrice: number;
  debouncedMaxPrice: number;
}

interface ProductsResponse {
  data: {
    data: Product[];
    meta: ProductMeta;
  };
}

export function useCollectionProducts({
  slug,
  initialProducts,
  initialMeta,
  sortOption,
  debouncedMinPrice,
  debouncedMaxPrice,
}: UseCollectionProductsOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const buildQueryParams = (page: number) => {
    const params = new URLSearchParams({
      limit: String(PRODUCTS_PER_PAGE),
      page: String(page),
      isActive: "true",
    });

    if (slug !== "all-products") {
      params.set("collectionSlug", slug);
    }

    if (debouncedMinPrice > 0) {
      params.set("minPrice", String(debouncedMinPrice));
    }
    if (debouncedMaxPrice < 5000) {
      params.set("maxPrice", String(debouncedMaxPrice));
    }

    const sort = SORT_OPTIONS_DATA[sortOption];
    if (sort) {
      params.set("sortBy", sort.sortBy);
      params.set("sortOrder", sort.sortOrder);
    }

    return params;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["collection-products", slug, sortOption, debouncedMinPrice, debouncedMaxPrice],
    queryFn: async ({ pageParam = 1 }) => {
      const params = buildQueryParams(pageParam);
      const response = await apiGet<ProductsResponse>(`/api/products?${params}`);
      return {
        products: response?.data?.data ?? [],
        meta: response?.data?.meta ?? initialMeta,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialData: {
      pages: [{ products: initialProducts, meta: initialMeta }],
      pageParams: [1],
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Flatten all pages into single products array
  const products = data?.pages.flatMap((page) => page.products) ?? initialProducts;
  const meta = data?.pages[data.pages.length - 1]?.meta ?? initialMeta;
  const isLoading = isFetching && !isFetchingNextPage;

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    products,
    meta,
    isLoading,
    loadMoreRef,
  };
}
