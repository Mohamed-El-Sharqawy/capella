"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Search, X, Loader2, Package, FolderTree } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { trackSearch } from "@/lib/analytics";

interface SearchProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number | null;
  imageUrl: string | null;
}

interface SearchCollection {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string | null;
}

interface SearchResults {
  products: SearchProduct[];
  collections: SearchCollection[];
}

export function GlobalSearch() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackedQueries = useRef<Set<string>>(new Set());

  // Debounce the query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results with React Query
  const { data: results = { products: [], collections: [] }, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      const data = await apiGet<SearchResults>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      // Track search (only once per unique query)
      if (!trackedQueries.current.has(debouncedQuery)) {
        trackedQueries.current.add(debouncedQuery);
        const totalResults = (data.products?.length || 0) + (data.collections?.length || 0);
        trackSearch(debouncedQuery, totalResults);
      }
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
  }, []);

  const handleResultClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const hasResults = results.products.length > 0 || results.collections.length > 0;
  const showDropdown = isOpen && (query.length >= 2 || hasResults);

  return (
    <div ref={containerRef} className="relative">
      {/* Search Button */}
      <button
        onClick={handleOpen}
        className="p-2 hover:opacity-70 transition-opacity"
        aria-label={isArabic ? "بحث" : "Search"}
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Search Modal/Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleClose}
          />

          {/* Search Container */}
          <div className="fixed left-1/2 -translate-x-1/2 top-4 w-[calc(100%-2rem)] max-w-md z-50 md:absolute md:translate-x-0 md:left-auto md:right-0 md:top-full md:mt-2 md:w-[400px]">
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isArabic ? "ابحث عن منتجات أو مجموعات..." : "Search products or collections..."}
                  className="flex-1 outline-none text-base"
                  dir={isArabic ? "rtl" : "ltr"}
                />
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : query && (
                  <button onClick={() => setQuery("")} className="p-1 hover:bg-gray-100 rounded">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Results */}
              {showDropdown && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {query.length >= 2 && !isLoading && !hasResults && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      {isArabic ? "لا توجد نتائج" : "No results found"}
                    </div>
                  )}

                  {/* Products */}
                  {results.products.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                        <Package className="h-3 w-3" />
                        {isArabic ? "المنتجات" : "Products"}
                      </div>
                      {results.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="w-12 h-14 bg-gray-100 rounded overflow-hidden relative shrink-0">
                            {product.imageUrl && (
                              <Image
                                src={product.imageUrl}
                                alt={isArabic ? product.nameAr : product.nameEn}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {isArabic ? product.nameAr : product.nameEn}
                            </p>
                            {product.price && (
                              <p className="text-sm text-gray-500">
                                LE {product.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Collections */}
                  {results.collections.length > 0 && (
                    <div className="p-2 border-t">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                        <FolderTree className="h-3 w-3" />
                        {isArabic ? "المجموعات" : "Collections"}
                      </div>
                      {results.collections.map((collection) => (
                        <Link
                          key={collection.id}
                          href={`/collections/${collection.slug}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden relative shrink-0">
                            {collection.imageUrl && (
                              <Image
                                src={collection.imageUrl}
                                alt={isArabic ? collection.nameAr : collection.nameEn}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">
                            {isArabic ? collection.nameAr : collection.nameEn}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* View All Link */}
                  {hasResults && (
                    <div className="p-3 border-t bg-gray-50">
                      <Link
                        href={`/collections?search=${encodeURIComponent(query)}`}
                        onClick={handleResultClick}
                        className="block text-center text-sm text-gray-600 hover:text-black transition"
                      >
                        {isArabic ? "عرض جميع النتائج" : "View all results"}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
