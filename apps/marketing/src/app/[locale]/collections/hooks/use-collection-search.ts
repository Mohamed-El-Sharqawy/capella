"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { trackSearch } from "@/lib/analytics";
import type { Collection } from "@ecommerce/shared-types";
import type { SearchProduct } from "../types";
import { SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH, STATIC_COLLECTIONS } from "../constants";

export function useCollectionSearch(collections: Collection[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const trackedQueries = useRef<Set<string>>(new Set());

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when search changes
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (debouncedQuery === currentSearch) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) {
      params.set("search", debouncedQuery);
    } else {
      params.delete("search");
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, pathname, router, searchParams]);

  // Fetch search results with React Query
  const shouldSearch = debouncedQuery.length >= MIN_SEARCH_LENGTH;
  const { data: searchData, isLoading: isSearching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      const data = await apiGet<{ products: SearchProduct[] }>(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`
      );
      const products = data.products || [];
      // Track search query (only once per unique query)
      if (!trackedQueries.current.has(debouncedQuery)) {
        trackedQueries.current.add(debouncedQuery);
        trackSearch(debouncedQuery, products.length);
      }
      return products;
    },
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const searchResults = searchData || [];

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < MIN_SEARCH_LENGTH) {
      return collections;
    }

    const query = debouncedQuery.toLowerCase();
    return collections.filter((c: any) => {
      const matchesName =
        c.nameEn?.toLowerCase().includes(query) || c.nameAr?.toLowerCase().includes(query);
      const matchesDesc =
        c.descriptionEn?.toLowerCase().includes(query) || c.descriptionAr?.toLowerCase().includes(query);
      return matchesName || matchesDesc;
    });
  }, [collections, debouncedQuery]);

  // Filter static collections too
  const filteredStaticCollections = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < MIN_SEARCH_LENGTH) {
      return STATIC_COLLECTIONS;
    }

    const query = debouncedQuery.toLowerCase();
    return STATIC_COLLECTIONS.filter(
      (c) => c.nameEn.toLowerCase().includes(query) || c.nameAr.toLowerCase().includes(query)
    );
  }, [debouncedQuery]);

  const isSearchActive = debouncedQuery.length >= MIN_SEARCH_LENGTH;
  const hasResults =
    filteredStaticCollections.length > 0 || filteredCollections.length > 0 || searchResults.length > 0;

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    searchResults,
    isSearching,
    filteredCollections,
    filteredStaticCollections,
    isSearchActive,
    hasResults,
  };
}
