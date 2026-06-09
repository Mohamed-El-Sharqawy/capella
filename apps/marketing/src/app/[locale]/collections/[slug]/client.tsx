"use client";

import { useEffect, useRef, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useCollectionFilters, useCollectionProducts } from "./hooks";
import { CollectionHeader, ProductGrid, LoadMore, FilterDrawer, CollectionPageSkeleton } from "./components";
import { trackCollectionView } from "@/lib/analytics";
import type { CollectionPageClientProps, SortOption } from "./types";
import Image from "next/image";

function CollectionPageContent({
  locale,
  slug,
  title,
  collections,
  initialProducts,
  initialMeta,
  videoUrl,
}: CollectionPageClientProps) {
  const t = useTranslations("collection");

  const {
    sortOption,
    setSortOption,
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
    clearFilters,
  } = useCollectionFilters();

  const { products, meta, isLoading, loadMoreRef } = useCollectionProducts({
    slug,
    initialProducts,
    initialMeta,
    sortOption,
    debouncedMinPrice,
    debouncedMaxPrice,
    availability,
  });

  // Track collection view on mount
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackCollectionView(slug, slug, title);
    }
  }, [slug, title]);

  const sortOptions: SortOption[] = [
    { value: "position", label: t("sort.manualOrder"), sortBy: "position", sortOrder: "asc" },
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
    <>
      {videoUrl && (
        <div className="block md:hidden w-full h-screen relative overflow-hidden bg-black">
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/50 to-transparent pointer-events-none" />
        </div>
      )}

      <div className="pb-8 pt-32 md:pt-36">
        <div className="lg:hidden">
          {slug === "all-products" && (
            <Image
              src={"/static-collections/assets/all-products.png"}
              alt="all products"
              width={1920}
              height={400}
              className="w-full object-cover"
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-8">
          <CollectionHeader
            sortOption={sortOption}
            sortOptions={sortOptions}
            onSortChange={setSortOption}
            isSortOpen={isSortOpen}
            setIsSortOpen={setIsSortOpen}
            onFilterOpen={() => setIsFilterOpen(true)}
          />

          <ProductGrid
            products={products}
            locale={locale}
            isLoading={isLoading}
            onClearFilters={clearFilters}
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
      </div>
    </>
  );
}

export function CollectionPageClient(props: CollectionPageClientProps) {
  return (
    <Suspense fallback={<CollectionPageSkeleton />}>
      <CollectionPageContent {...props} />
    </Suspense>
  );
}
