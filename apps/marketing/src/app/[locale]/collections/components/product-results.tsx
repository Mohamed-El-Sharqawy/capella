"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SearchProduct } from "../types";

interface ProductResultsProps {
  products: SearchProduct[];
  locale: string;
}

export function ProductResults({ products, locale }: ProductResultsProps) {
  const t = useTranslations("collection");
  const isArabic = locale === "ar";

  if (products.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        {t("products")}
        <span className="text-sm font-normal text-gray-500">({products.length})</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group">
            <div className="aspect-3/4 bg-gray-100 rounded-lg overflow-hidden relative mb-2">
              {product.imageUrl && (
                <Image
                  src={product.imageUrl}
                  alt={isArabic ? product.nameAr : product.nameEn}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </div>
            <h3 className="text-sm font-medium truncate">
              {isArabic ? product.nameAr : product.nameEn}
            </h3>
            {product.price && <p className="text-sm text-gray-600">LE {product.price.toLocaleString()}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
