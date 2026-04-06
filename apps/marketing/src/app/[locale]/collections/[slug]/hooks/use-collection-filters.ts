"use client";

import { useState, useEffect } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { useRouter } from "@/i18n/navigation";
import {
  DEFAULT_SORT,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_MIN_PRICE,
  DEFAULT_MAX_PRICE,
  PRICE_DEBOUNCE_MS,
} from "../constants";
import type { GridColumns, AvailabilityFilter } from "../types";

export function useCollectionFilters() {
  const router = useRouter();

  // URL-synced state with nuqs
  const [sortOption, setSortOption] = useQueryState("sort", parseAsString.withDefault(DEFAULT_SORT));
  const [gridColumns, setGridColumns] = useQueryState("grid", parseAsInteger.withDefault(DEFAULT_GRID_COLUMNS));
  const [minPrice, setMinPrice] = useQueryState("minPrice", parseAsInteger.withDefault(DEFAULT_MIN_PRICE));
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsInteger.withDefault(DEFAULT_MAX_PRICE));

  // Debounced price values for fetching
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);

  // Local state (not URL-synced)
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");

  // Debounce price changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, PRICE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  const navigateToCollection = (collectionSlug: string | null) => {
    setIsFilterOpen(false);
    if (collectionSlug) {
      router.push(`/collections/${collectionSlug}`);
    } else {
      router.push("/collections/all-products");
    }
  };

  return {
    sortOption,
    setSortOption,
    gridColumns,
    setGridColumns: (cols: GridColumns) => setGridColumns(cols),
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    debouncedMinPrice,
    debouncedMaxPrice,
    isSortOpen,
    setIsSortOpen,
    isFilterOpen,
    setIsFilterOpen,
    availability,
    setAvailability,
    navigateToCollection,
  };
}
