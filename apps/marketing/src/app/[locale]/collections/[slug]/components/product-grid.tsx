"use client";

import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { ProductCardWithVariants } from "@/components/ui/product-card-with-variants";
import { ProductCardHorizontal } from "@/components/ui/product-card-horizontal";
import { ProductCardSkeleton, ProductCardHorizontalSkeleton } from "@/components/ui/product-card-skeleton";
import { Button } from "@/components/ui/button";
import { GRID_COLS_CLASS } from "../constants";
import { Product } from "@ecommerce/shared-types";

interface ProductGridProps {
  products: Product[];
  locale: string;
  gridColumns: number;
  isLoading: boolean;
  onClearFilters?: () => void;
}

export function ProductGrid({
  products,
  locale,
  gridColumns,
  isLoading,
  onClearFilters,
}: ProductGridProps) {
  const t = useTranslations("collection");

  // Show skeletons when loading with no products
  if (isLoading && products.length === 0) {
    return gridColumns === 1 ? (
      <div className="divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardHorizontalSkeleton key={i} />
        ))}
      </div>
    ) : (
      <div className={`grid ${GRID_COLS_CLASS[gridColumns]} gap-4 md:gap-6`}>
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

  // Horizontal layout
  if (gridColumns === 1) {
    return (
      <div className="divide-y">
        {products.map((product) => (
          <ProductCardHorizontal key={product.id} product={product} locale={locale} />
        ))}
      </div>
    );
  }

  // Grid layout
  return (
    <div className={`grid ${GRID_COLS_CLASS[gridColumns]} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCardWithVariants key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}
