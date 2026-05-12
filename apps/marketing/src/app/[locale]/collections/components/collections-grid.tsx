"use client";

import { useTranslations } from "next-intl";
import type { Collection } from "@ecommerce/shared-types";
import type { StaticCollection } from "../types";
import { CollectionCard } from "./collection-card";

interface CollectionsGridProps {
  staticCollections: StaticCollection[];
  collections: Collection[];
  locale: string;
  isSearchActive: boolean;
  debouncedQuery: string;
}

export function CollectionsGrid({
  staticCollections,
  collections,
  locale,
  isSearchActive,
  debouncedQuery,
}: CollectionsGridProps) {
  const t = useTranslations("collection");

  if (staticCollections.length === 0 && collections.length === 0) {
    return null;
  }

  return (
    <>
      {isSearchActive && (
        <h2
          className="text-lg md:text-xl font-medium uppercase mb-6"
          style={{ letterSpacing: locale === "ar" ? "0em" : "0.1em" }}
        >
          {t("collections")}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {/* Static Collections */}
        {staticCollections.map((collection) => (
          <CollectionCard
            key={collection.slug}
            slug={collection.slug}
            nameEn={collection.nameEn}
            nameAr={collection.nameAr}
            imageUrl={collection.imageUrl}
            locale={locale}
          />
        ))}

        {/* Dynamic Collections */}
        {collections.flatMap((collection: any) => {
          const items = [];
          items.push(
            <CollectionCard
              key={collection.id}
              slug={collection.slug}
              nameEn={collection.nameEn}
              nameAr={collection.nameAr}
              imageUrl={collection.image?.url}
              locale={locale}
            />
          );

          if (collection.children && collection.children.length > 0) {
            const query = debouncedQuery?.toLowerCase() || "";
            collection.children
              .filter((child: any) => {
                if (!isSearchActive) return child._count?.products > 0;
                const matchesName =
                  child.nameEn?.toLowerCase().includes(query) ||
                  child.nameAr?.toLowerCase().includes(query);
                return child._count?.products > 0 && matchesName;
              })
              .forEach((child: any) => {
                items.push(
                  <CollectionCard
                    key={child.id}
                    slug={child.slug}
                    nameEn={child.nameEn}
                    nameAr={child.nameAr}
                    imageUrl={child.image?.url}
                    locale={locale}
                  />
                );
              });
          }
          return items;
        })}
      </div>
    </>
  );
}
