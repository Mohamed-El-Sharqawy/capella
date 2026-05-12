"use client";

import { useTranslations } from "next-intl";
import { ProductCardWithVariants } from "@/components/ui/product-card-with-variants";
import { Product } from "@ecommerce/shared-types";

interface RelatedProductsProps {
  products: Product[];
  locale: string;
}

export function RelatedProducts({ products, locale }: RelatedProductsProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";

  if (products.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-20 border-t border-gray-100">
      <h2 className="text-xl md:text-2xl font-medium text-center mb-12 uppercase" style={{ letterSpacing: isArabic ? "0em" : "0.2em" }}>
        {t("youMayAlsoLike")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
