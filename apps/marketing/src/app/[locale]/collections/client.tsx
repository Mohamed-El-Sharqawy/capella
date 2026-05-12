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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="text-center mb-10 md:mb-14">
          <h1
            className="text-2xl md:text-3xl font-light uppercase"
            style={{ letterSpacing: locale === "ar" ? "0em" : "0.2em" }}
          >
            {t("shopByCollection")}
          </h1>
          <div className="w-12 h-px bg-black/20 mx-auto mt-5" />
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          isSearching={isSearching}
          locale={locale}
        />

        {isSearchActive && !isSearching && !hasResults && (
          <NoResults query={debouncedQuery} onClear={() => setSearchQuery("")} />
        )}

        {isSearchActive && <ProductResults products={searchResults} locale={locale} />}

        <CollectionsGrid
          staticCollections={filteredStaticCollections}
          collections={filteredCollections}
          locale={locale}
          isSearchActive={isSearchActive}
          debouncedQuery={debouncedQuery}
        />
      </div>
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
