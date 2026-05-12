"use client";

import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ProductBreadcrumbProps {
  productName: string;
  collectionName?: string;
  collectionSlug?: string;
  locale: string;
}

export function ProductBreadcrumb({ productName, collectionName, collectionSlug, locale }: ProductBreadcrumbProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className={`flex items-center gap-2 text-xs md:text-sm font-light text-gray-400 uppercase ${isArabic ? "flex-row-reverse" : "flex-row"}`} style={{ letterSpacing: isArabic ? "0em" : "0.15em" }}>
        <Link href="/" className="hover:text-black transition-colors">
          {t("home")}
        </Link>
        <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />

        <Link href="/collections/all-products" className="hover:text-black transition-colors">
          {t("products")}
        </Link>
        <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />

        {collectionName && collectionSlug && (
          <>
            <Link href={`/collections/${collectionSlug}`} className="hover:text-black transition-colors">
              {collectionName}
            </Link>
            <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />
          </>
        )}

        <span className="text-gray-900 truncate max-w-[150px] md:max-w-none">
          {productName}
        </span>
      </nav>
    </div>
  );
}
