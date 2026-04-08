"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Search, X, Loader2, Package, FolderTree, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

interface SearchProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number | null;
  imageUrl: string | null;
  badge?: string | null;
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

interface TrendingProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number | null;
  imageUrl: string | null;
  badge?: string | null;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 5;

export function SearchOverlay() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedQueries = useRef<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.query !== searchQuery);
      const updated = [
        { query: searchQuery, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

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

  const { data: trendingData } = useQuery({
    queryKey: ["trending-products"],
    queryFn: async () => {
      const data = await apiGet<{ data: TrendingProduct[] }>("/api/search/trending");
      return data.data ?? [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const { data: results = { products: [], collections: [] }, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      const data = await apiGet<SearchResults>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const trackQueryMutation = useMutation({
    mutationFn: async (data: { query: string; resultsCount: number }) => {
      return apiPost("/api/search/analytics/query", data);
    },
  });

  const trackClickMutation = useMutation({
    mutationFn: async (data: { query: string; productId?: string; collectionId?: string; position?: number }) => {
      return apiPost("/api/search/analytics/click", data);
    },
  });

  useEffect(() => {
    if (debouncedQuery.length >= 2 && !trackedQueries.current.has(debouncedQuery)) {
      trackedQueries.current.add(debouncedQuery);
      const totalResults = (results.products?.length || 0) + (results.collections?.length || 0);
      trackQueryMutation.mutate({ query: debouncedQuery, resultsCount: totalResults });
      saveRecentSearch(debouncedQuery);
    }
  }, [debouncedQuery, results, saveRecentSearch]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (inputRef.current) inputRef.current.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
  }, []);

  const handleResultClick = useCallback((type: "product" | "collection", id: string, position?: number) => {
    if (debouncedQuery) {
      trackClickMutation.mutate({
        query: debouncedQuery,
        ...(type === "product" ? { productId: id } : { collectionId: id }),
        position,
      });
    }
    handleClose();
  }, [debouncedQuery, handleClose]);

  const hasResults = results.products.length > 0 || results.collections.length > 0;
  const showResults = debouncedQuery.length >= 2;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="p-2 hover:opacity-60 transition-opacity"
        aria-label={isArabic ? "بحث" : "Search"}
      >
        <Search className="h-5 w-5 stroke-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: isArabic ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? "-100%" : "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`absolute inset-y-0 ${isArabic ? "left-0" : "right-0"} w-full md:w-[450px] bg-white shadow-2xl flex flex-col`}
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex-1 flex items-center gap-3">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isArabic ? "ابحث هنا..." : "Search here..."}
                    className="flex-1 bg-transparent border-none outline-none text-sm uppercase tracking-widest placeholder:text-gray-300"
                    dir={isArabic ? "rtl" : "ltr"}
                  />
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
                <button onClick={handleClose} className="p-2 hover:opacity-60 transition-opacity ml-2">
                  <X className="h-6 w-6 stroke-1" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {showResults ? (
                  <div className="space-y-12">
                    {results.products.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none">
                          {isArabic ? "المنتجات" : "Products"}
                        </h3>
                        {results.products.map((product, index) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={() => handleResultClick("product", product.id, index)}
                            className="flex gap-4 group"
                          >
                            <div className="w-16 aspect-3/4 bg-gray-50 overflow-hidden relative rounded-sm">
                              {product.imageUrl && (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.nameEn}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-xs uppercase tracking-widest font-medium">
                                {isArabic ? product.nameAr : product.nameEn}
                              </p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                AED  {product.price?.toLocaleString()}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {results.collections.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none">
                          {isArabic ? "المجموعات" : "Collections"}
                        </h3>
                        <div className="grid gap-2">
                          {results.collections.map((collection, index) => (
                            <Link
                              key={collection.id}
                              href={`/collections/${collection.slug}`}
                              onClick={() => handleResultClick("collection", collection.id, index)}
                              className="text-xs uppercase tracking-widest py-2 hover:translate-x-2 transition-transform inline-block"
                            >
                              {isArabic ? collection.nameAr : collection.nameEn}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isLoading && !hasResults && (
                      <div className="text-center py-20 space-y-4">
                        <p className="text-xs uppercase tracking-widest text-gray-400">
                          {isArabic ? "لا توجد نتائج" : "No results found"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Trending */}
                    {trendingData && trendingData.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none">
                          {isArabic ? "الأكثر رواجاً" : "Trending Now"}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {trendingData.slice(0, 4).map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              onClick={handleClose}
                              className="space-y-2 group"
                            >
                              <div className="aspect-3/4 bg-gray-50 overflow-hidden relative rounded-sm">
                                {product.imageUrl && (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.nameEn}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                )}
                              </div>
                              <p className="text-[10px] uppercase tracking-widest truncate">
                                {isArabic ? product.nameAr : product.nameEn}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent */}
                    {recentSearches.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none">
                          {isArabic ? "عمليات البحث الأخيرة" : "Recent Searches"}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search) => (
                            <button
                              key={search.query}
                              onClick={() => {
                                setQuery(search.query);
                                setDebouncedQuery(search.query);
                              }}
                              className="text-xs uppercase tracking-widest py-2 px-4 border border-gray-100 hover:border-black transition-colors rounded-sm"
                            >
                              {search.query}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

