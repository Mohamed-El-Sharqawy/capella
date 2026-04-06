"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useCollectionSearch } from "./hooks";
import {
  SearchInput,
  NoResults,
  ProductResults,
  CollectionsGrid,
  CollectionsPageSkeleton,
} from "./components";
import type { CollectionsPageClientProps } from "./types";

function CollectionsPageContent({ collections, locale }: CollectionsPageClientProps) {
  const t = useTranslations("collection");

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    searchResults,
    isSearching,
    filteredCollections,
    filteredStaticCollections,
    isSearchActive,
    hasResults,
  } = useCollectionSearch(collections);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">{t("shopByCollection")}</h1>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        isSearching={isSearching}
        locale={locale}
      />

      {/* No Results */}
      {isSearchActive && !isSearching && !hasResults && (
        <NoResults query={debouncedQuery} onClear={() => setSearchQuery("")} />
      )}

      {/* Product Results (when searching) */}
      {isSearchActive && <ProductResults products={searchResults} locale={locale} />}

      {/* Collections Grid */}
      <CollectionsGrid
        staticCollections={filteredStaticCollections}
        collections={filteredCollections}
        locale={locale}
        isSearchActive={isSearchActive}
        debouncedQuery={debouncedQuery}
      />
    </div>
  );
}

export function CollectionsPageClient(props: CollectionsPageClientProps) {
  return (
    <Suspense fallback={<CollectionsPageSkeleton />}>
      <CollectionsPageContent {...props} />
    </Suspense>
  );
}
