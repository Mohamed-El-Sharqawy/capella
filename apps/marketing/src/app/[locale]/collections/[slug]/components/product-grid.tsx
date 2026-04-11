"use client";

import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { ProductCardWithVariants } from "@/components/ui/product-card-with-variants";
import { ProductCardSkeleton } from "@/components/ui/product-card-skeleton";
import { Button } from "@/components/ui/button";
import { Product } from "@ecommerce/shared-types";

interface ProductGridProps {
  products: Product[];
  locale: string;
  isLoading: boolean;
  onClearFilters?: () => void;
}

export function ProductGrid({
  products,
  locale,
  isLoading,
  onClearFilters,
}: ProductGridProps) {
  const t = useTranslations("collection");

  const GRID_LAYOUT_CLASS = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-10";

  // Show skeletons when loading with no products
  if (isLoading && products.length === 0) {
    return (
      <div className={GRID_LAYOUT_CLASS}>
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // No products found
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-gray-50 p-6 rounded-full mb-6">
          <SearchX className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t("noProducts")}
        </h3>
        <p className="text-gray-500 max-w-xs mb-8">
          {t("noProductsDesc")}
        </p>
        {onClearFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="rounded-full px-8"
          >
            {t("clearFilters")}
          </Button>
        )}
      </div>
    );
  }

  // Grid layout
  return (
    <div className={GRID_LAYOUT_CLASS}>
      {products.map((product) => (
        <ProductCardWithVariants key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}
