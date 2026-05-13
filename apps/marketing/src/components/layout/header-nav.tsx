"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { cn } from "@/lib/utils";

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
    <nav className="flex items-center gap-4 lg:gap-6 text-current">
      {/* Shop by Collection - with dropdown */}
      <div
        className="relative"
        onMouseEnter={() => setHoveredItem("shop-by-collection")}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <Link
          href="/collections"
          className="flex items-center gap-1.5 font-medium uppercase opacity-90 hover:opacity-100 transition-opacity"
          style={{
            fontSize: isArabic ? "14px" : "13px",
            letterSpacing: isArabic ? "0em" : "0.15em",
          }}
        >
          {t("jewelleries")}
          <ChevronDown className="h-3 w-3" />
        </Link>

        {/* Dropdown with collections */}
        {hoveredItem === "shop-by-collection" && headerCollections.length > 0 && (
          <div className={cn("absolute top-full pt-2 z-50", isArabic ? "right-0" : "left-0")}>
            <div className="bg-white border rounded-lg shadow-lg py-2 min-w-[200px]">
              {headerCollections.map((collection) => (
                <div key={collection.id}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="block text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
                  >
                    {isArabic ? collection.nameAr : collection.nameEn}
                  </Link>
                  {/* Nested children */}
                  {collection.children && collection.children.length > 0 && (
                    <div className="border-s ms-4">
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
                  href="/collections/all-products"
                  className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 transition"
                >
                  {t("shopAll")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/contact"
        className="font-medium uppercase opacity-90 hover:opacity-100 transition-opacity"
        style={{
          fontSize: isArabic ? "14px" : "13px",
          letterSpacing: isArabic ? "0em" : "0.15em",
        }}
      >
        {t("contactUs")}
      </Link>

      {/* About */}
      <Link
        href="/about"
        className="font-medium uppercase hover:opacity-100 transition-opacity"
        style={{
          fontSize: isArabic ? "14px" : "13px",
          letterSpacing: isArabic ? "0em" : "0.15em",
        }}
      >
        {t("aboutUs")}
      </Link>
    </nav>
  );
}
