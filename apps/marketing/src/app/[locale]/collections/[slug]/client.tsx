"use client";

import { useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useCollectionFilters, useCollectionProducts } from "./hooks";
import { CollectionHeader, ProductGrid, LoadMore, FilterDrawer, CollectionPageSkeleton } from "./components";
import { trackCollectionView } from "@/lib/analytics";
import type { CollectionPageClientProps, SortOption } from "./types";

function CollectionPageContent({
  locale,
  slug,
  title,
  collections,
  initialProducts,
  initialMeta,
}: CollectionPageClientProps) {
  const t = useTranslations("collection");

  const {
    sortOption,
    setSortOption,
    gridColumns,
    setGridColumns,
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
  } = useCollectionFilters();

  const { products, meta, isLoading, loadMoreRef } = useCollectionProducts({
    slug,
    initialProducts,
    initialMeta,
    sortOption,
    debouncedMinPrice,
    debouncedMaxPrice,
  });

  // Track collection view on mount
  useEffect(() => {
    trackCollectionView(slug, slug, title);
  }, [slug, title]);

  const sortOptions: SortOption[] = [
    { value: "featured", label: t("sort.featured"), sortBy: "isFeatured", sortOrder: "desc" },
    { value: "best-selling", label: t("sort.bestSelling"), sortBy: "createdAt", sortOrder: "desc" },
    { value: "alpha-asc", label: t("sort.alphaAsc"), sortBy: "nameEn", sortOrder: "asc" },
    { value: "alpha-desc", label: t("sort.alphaDesc"), sortBy: "nameEn", sortOrder: "desc" },
    { value: "price-asc", label: t("sort.priceAsc"), sortBy: "price", sortOrder: "asc" },
    { value: "price-desc", label: t("sort.priceDesc"), sortBy: "price", sortOrder: "desc" },
    { value: "date-asc", label: t("sort.dateAsc"), sortBy: "createdAt", sortOrder: "asc" },
    { value: "date-desc", label: t("sort.dateDesc"), sortBy: "createdAt", sortOrder: "desc" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <CollectionHeader
        sortOption={sortOption}
        sortOptions={sortOptions}
        onSortChange={setSortOption}
        isSortOpen={isSortOpen}
        setIsSortOpen={setIsSortOpen}
        gridColumns={gridColumns}
        setGridColumns={setGridColumns}
        onFilterOpen={() => setIsFilterOpen(true)}
      />

      <ProductGrid
        products={products}
        locale={locale}
        gridColumns={gridColumns}
        isLoading={isLoading}
      />

      <LoadMore
        ref={loadMoreRef}
        isLoading={isLoading}
        meta={meta}
        hasProducts={products.length > 0}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        locale={locale}
        slug={slug}
        collections={collections}
        onNavigateToCollection={navigateToCollection}
        availability={availability}
        onAvailabilityChange={setAvailability}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
      />
    </div>
  );
}

export function CollectionPageClient(props: CollectionPageClientProps) {
  return (
    <Suspense fallback={<CollectionPageSkeleton />}>
      <CollectionPageContent {...props} />
    </Suspense>
  );
}
