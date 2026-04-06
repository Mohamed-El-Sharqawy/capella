"use client";

import type { Product } from "@ecommerce/shared-types";
import { ProductCardWithVariants } from "@/components/ui/product-card-with-variants";
import { ProductCardHorizontal } from "@/components/ui/product-card-horizontal";
import { ProductCardSkeleton, ProductCardHorizontalSkeleton } from "@/components/ui/product-card-skeleton";
import { GRID_COLS_CLASS } from "../constants";

interface ProductGridProps {
  products: Product[];
  locale: string;
  gridColumns: number;
  isLoading: boolean;
}

export function ProductGrid({ products, locale, gridColumns, isLoading }: ProductGridProps) {
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
