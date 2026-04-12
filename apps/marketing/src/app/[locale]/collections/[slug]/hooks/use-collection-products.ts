"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Product } from "@ecommerce/shared-types";
import { apiGet } from "@/lib/api-client";
import { PRODUCTS_PER_PAGE, SORT_OPTIONS_DATA, DEFAULT_SORT, DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE } from "../constants";
import type { ProductMeta, AvailabilityFilter } from "../types";

interface UseCollectionProductsOptions {
  slug: string;
  initialProducts: Product[];
  initialMeta: ProductMeta;
  sortOption: string;
  debouncedMinPrice: number;
  debouncedMaxPrice: number;
  availability: AvailabilityFilter;
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
  availability,
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

    // Always send prices when they differ from total range, 
    // or always send them if we want hard filters.
    // As per user request: "fix this behaviour" regarding products above 5000 showing up.
    // So we should always send maxPrice if it's set in the UI.
    if (debouncedMinPrice !== DEFAULT_MIN_PRICE) {
      params.set("minPrice", String(debouncedMinPrice));
    }
    if (debouncedMaxPrice !== DEFAULT_MAX_PRICE) {
      params.set("maxPrice", String(debouncedMaxPrice));
    }

    if (availability !== "all") {
      params.set("availability", availability);
    }

    const sort = SORT_OPTIONS_DATA[sortOption];
    if (sort) {
      params.set("sortBy", sort.sortBy);
      params.set("sortOrder", sort.sortOrder);
    }

    return params;
  };

  // Only use initialData if we are on the first page and no filters are active (matching SSR)
  const isDefaultState = 
    sortOption === DEFAULT_SORT && 
    debouncedMinPrice === DEFAULT_MIN_PRICE && 
    debouncedMaxPrice === DEFAULT_MAX_PRICE && 
    availability === "all";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["collection-products", slug, sortOption, debouncedMinPrice, debouncedMaxPrice, availability],
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
    // Only provide initialData if it's the exact state the server rendered
    initialData: isDefaultState ? {
      pages: [{ products: initialProducts, meta: initialMeta }],
      pageParams: [1],
    } : undefined,
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
