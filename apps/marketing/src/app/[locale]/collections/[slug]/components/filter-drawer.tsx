"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Collection } from "@ecommerce/shared-types";
import type { AvailabilityFilter } from "../types";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  slug: string;
  collections: Collection[];
  onNavigateToCollection: (slug: string | null) => void;
  availability: AvailabilityFilter;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  locale,
  slug,
  collections,
  onNavigateToCollection,
  availability,
  onAvailabilityChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: FilterDrawerProps) {
  const t = useTranslations("collection");
  const isArabic = locale === "ar";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${isArabic ? "right-0" : "left-0"} h-full w-80 bg-white z-50 overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : isArabic ? "translate-x-full" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="font-semibold text-sm">{t("filter")}</span>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collections */}
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm mb-3">{t("collections")}</h3>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateToCollection(null)}
              className={`block text-sm ${
                slug === "all-products" ? "text-red-600 font-medium" : "text-gray-600 hover:text-black"
              }`}
            >
              {t("allProducts")}
            </button>
            {collections.map((collection: any) => (
              <div key={collection.id}>
                <button
                  onClick={() => onNavigateToCollection(collection.slug)}
                  className={`flex items-center justify-between w-full text-sm ${
                    slug === collection.slug ? "text-red-600 font-medium" : "text-gray-600 hover:text-black"
                  }`}
                >
                  <span>{isArabic ? collection.nameAr : collection.nameEn}</span>
                  {collection._count?.products !== undefined && (
                    <span className="text-xs text-gray-400">({collection._count.products})</span>
                  )}
                </button>
                {/* Nested children */}
                {collection.children && collection.children.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                    {collection.children.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => onNavigateToCollection(child.slug)}
                        className={`flex items-center justify-between w-full text-sm ${
                          slug === child.slug ? "text-red-600 font-medium" : "text-gray-500 hover:text-black"
                        }`}
                      >
                        <span>{isArabic ? child.nameAr : child.nameEn}</span>
                        {child._count?.products !== undefined && (
                          <span className="text-xs text-gray-400">({child._count.products})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm mb-3">{t("availability")}</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={availability === "inStock"}
                onChange={() => onAvailabilityChange(availability === "inStock" ? "all" : "inStock")}
                className="rounded"
              />
              {t("inStock")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={availability === "outOfStock"}
                onChange={() => onAvailabilityChange(availability === "outOfStock" ? "all" : "outOfStock")}
                className="rounded"
              />
              {t("outOfStock")}
            </label>
          </div>
        </div>

        {/* Price Range */}
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-3">{t("price")}</h3>
          <div className="space-y-4">
            <input
              type="range"
              min={0}
              max={5000}
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(Number(e.target.value))}
              className="w-full accent-red-600"
            />
            <div className="flex items-center gap-2 text-sm">
              <span>{t("price")}:</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => onMinPriceChange(Number(e.target.value))}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
