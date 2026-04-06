"use client";

import { ProductCardWithVariants } from "@/components/ui/product-card-with-variants";
import type { SuggestedProductsProps } from "../types";

export function SuggestedProducts({ products, locale, title }: SuggestedProductsProps) {
  if (products.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-xl font-semibold text-center mb-8">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCardWithVariants
            key={product.id}
            product={product}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
