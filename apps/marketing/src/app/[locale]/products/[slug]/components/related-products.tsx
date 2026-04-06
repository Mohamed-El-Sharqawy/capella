"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@ecommerce/shared-types";

interface RelatedProductsProps {
  products: Product[];
  locale: string;
}

export function RelatedProducts({ products, locale }: RelatedProductsProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";

  if (products.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-12 border-t">
      <h2 className="text-xl font-semibold text-center mb-8">{t("featuredProducts")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="group">
            <div className="relative aspect-3/4 bg-neutral-100 rounded overflow-hidden mb-2">
              {p.variants?.[0]?.images?.[0]?.url && (
                <Image
                  src={p.variants[0].images[0].url}
                  alt={isArabic ? p.nameAr : p.nameEn}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              )}
              {p.variants?.[0]?.compareAtPrice &&
                p.variants[0].compareAtPrice > p.variants[0].price && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -
                    {Math.round(
                      ((p.variants[0].compareAtPrice - p.variants[0].price) /
                        p.variants[0].compareAtPrice) *
                        100
                    )}
                    %
                  </span>
                )}
            </div>
            <h3 className="text-sm font-medium truncate">{isArabic ? p.nameAr : p.nameEn}</h3>
            <div className="flex items-center gap-2">
              {p.variants?.[0]?.compareAtPrice &&
                p.variants[0].compareAtPrice > p.variants[0].price && (
                  <span className="text-xs text-muted-foreground line-through">
                    LE {p.variants[0].compareAtPrice.toLocaleString()}
                  </span>
                )}
              <span className="text-sm font-semibold text-red-600">
                LE {p.variants?.[0]?.price?.toLocaleString()}
              </span>
            </div>
            {/* Color swatches */}
            {p.variants && p.variants.length > 1 && (
              <div className="flex gap-1 mt-1">
                {p.variants
                  .filter((v) => v.color)
                  .reduce((acc, v) => {
                    if (v.color && !acc.find((c) => c.id === v.color!.id)) {
                      acc.push(v.color);
                    }
                    return acc;
                  }, [] as Array<{ id: string; hex: string }>)
                  .slice(0, 5)
                  .map((color) => (
                    <span
                      key={color.id}
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
