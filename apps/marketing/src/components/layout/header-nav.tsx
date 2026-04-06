"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { apiGet } from "@/lib/api-client";

interface HeaderCollection {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  children?: { id: string; slug: string; nameEn: string; nameAr: string }[];
}

async function fetchHeaderCollections(): Promise<HeaderCollection[]> {
  try {
    const data = await apiGet<{ data: HeaderCollection[] }>("/api/collections/header");
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export function HeaderNav() {
  const t = useTranslations("header");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const { data: headerCollections = [] } = useQuery({
    queryKey: ["header-collections"],
    queryFn: fetchHeaderCollections,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <nav className="hidden md:flex items-center gap-6">
      {/* Shop All */}
      <Link
        href="/collections/all-products"
        className="text-sm font-medium hover:opacity-70 transition-opacity"
      >
        {t("shopAll")}
      </Link>

      {/* Shop by Collection - with dropdown */}
      <div
        className="relative"
        onMouseEnter={() => setHoveredItem("shop-by-collection")}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <Link
          href="/collections"
          className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
        >
          {t("shopByCollection")}
          <ChevronDown className="h-4 w-4" />
        </Link>

        {/* Dropdown with collections */}
        {hoveredItem === "shop-by-collection" && headerCollections.length > 0 && (
          <div className="absolute top-full left-0 pt-2 z-50">
            <div className="bg-white border rounded-lg shadow-lg py-2 min-w-[200px]">
              {headerCollections.map((collection) => (
                <div key={collection.id}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="block px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
                  >
                    {isArabic ? collection.nameAr : collection.nameEn}
                  </Link>
                  {/* Nested children */}
                  {collection.children && collection.children.length > 0 && (
                    <div className="border-l ml-4">
                      {collection.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/collections/${child.slug}`}
                          className="block px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition"
                        >
                          {isArabic ? child.nameAr : child.nameEn}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* View All link */}
              <div className="border-t mt-2 pt-2">
                <Link
                  href="/collections"
                  className="block px-4 py-2 text-sm text-red-600 font-medium hover:bg-gray-100 transition"
                >
                  {isArabic ? "عرض الكل" : "View All Collections"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Static items */}
      <Link
        href="/return-policy"
        className="text-sm font-medium hover:opacity-70 transition-opacity"
      >
        {t("returnPolicy")}
      </Link>
      <Link
        href="/contact"
        className="text-sm font-medium hover:opacity-70 transition-opacity"
      >
        {t("contactUs")}
      </Link>
    </nav>
  );
}
