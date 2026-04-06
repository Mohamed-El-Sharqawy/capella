"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Search, X, Loader2, Package, FolderTree, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

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

  // Load recent searches from localStorage
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

  // Save recent searches to localStorage
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

  // Fetch trending products when overlay opens
  const { data: trendingData } = useQuery({
    queryKey: ["trending-products"],
    queryFn: async () => {
      const data = await apiGet<{ data: TrendingProduct[] }>("/api/search/trending");
      return data.data ?? [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch search results with React Query
  const { data: results = { products: [], collections: [] }, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      const data = await apiGet<SearchResults>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Track search query mutation
  const trackQueryMutation = useMutation({
    mutationFn: async (data: { query: string; resultsCount: number }) => {
      return apiPost("/api/search/analytics/query", data);
    },
  });

  // Track click mutation
  const trackClickMutation = useMutation({
    mutationFn: async (data: { query: string; productId?: string; collectionId?: string; position?: number }) => {
      return apiPost("/api/search/analytics/click", data);
    },
  });

  // Track search when results come in
  useEffect(() => {
    if (debouncedQuery.length >= 2 && !trackedQueries.current.has(debouncedQuery)) {
      trackedQueries.current.add(debouncedQuery);
      const totalResults = (results.products?.length || 0) + (results.collections?.length || 0);
      trackQueryMutation.mutate({ query: debouncedQuery, resultsCount: totalResults });
      saveRecentSearch(debouncedQuery);
    }
  }, [debouncedQuery, results, saveRecentSearch]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
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

  const handleRecentSearchClick = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setDebouncedQuery(searchQuery);
  }, []);

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const hasResults = results.products.length > 0 || results.collections.length > 0;
  const showResults = debouncedQuery.length >= 2;

  return (
    <div className="relative">
      {/* Search Button */}
      <button
        onClick={handleOpen}
        className="p-2 hover:opacity-70 transition-opacity"
        aria-label={isArabic ? "بحث" : "Search"}
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Full-screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3 flex-1 max-w-3xl mx-auto">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isArabic ? "ابحث عن منتجات أو مجموعات..." : "Search products or collections..."}
                className="flex-1 outline-none text-lg"
                dir={isArabic ? "rtl" : "ltr"}
              />
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : query && (
                <button onClick={() => setQuery("")} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full ml-4"
              aria-label={isArabic ? "إغلاق" : "Close"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto p-4 overflow-y-auto h-[calc(100vh-80px)]">
            {/* Search Results */}
            {showResults ? (
              <>
                {query.length >= 2 && !isLoading && !hasResults && (
                  <div className="py-12 text-center text-gray-500">
                    <p className="text-lg">{isArabic ? "لا توجد نتائج" : "No results found"}</p>
                    <p className="text-sm mt-2">{isArabic ? "جرب البحث بكلمات مختلفة" : "Try searching with different keywords"}</p>
                  </div>
                )}

                {/* Products */}
                {results.products.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500 uppercase">
                      <Package className="h-4 w-4" />
                      {isArabic ? "المنتجات" : "Products"}
                    </div>
                    <div className="space-y-2">
                      {results.products.map((product, index) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => handleResultClick("product", product.id, index)}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden relative shrink-0">
                            {product.imageUrl && (
                              <Image
                                src={product.imageUrl}
                                alt={isArabic ? product.nameAr : product.nameEn}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {isArabic ? product.nameAr : product.nameEn}
                            </p>
                            {product.price && (
                              <p className="text-sm text-gray-500 mt-1">
                                AED {product.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collections */}
                {results.collections.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500 uppercase">
                      <FolderTree className="h-4 w-4" />
                      {isArabic ? "المجموعات" : "Collections"}
                    </div>
                    <div className="space-y-2">
                      {results.collections.map((collection, index) => (
                        <Link
                          key={collection.id}
                          href={`/collections/${collection.slug}`}
                          onClick={() => handleResultClick("collection", collection.id, index)}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden relative shrink-0">
                            {collection.imageUrl && (
                              <Image
                                src={collection.imageUrl}
                                alt={isArabic ? collection.nameAr : collection.nameEn}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            )}
                          </div>
                          <p className="font-medium truncate flex-1">
                            {isArabic ? collection.nameAr : collection.nameEn}
                          </p>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Trending Now */}
                {trendingData && trendingData.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-500 uppercase">
                      <TrendingUp className="h-4 w-4" />
                      {isArabic ? "الأكثر رواجاً" : "Trending Now"}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {trendingData.slice(0, 4).map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={handleClose}
                          className="group"
                        >
                          <div className="aspect-3/4 bg-gray-100 rounded-lg overflow-hidden relative mb-2">
                            {product.imageUrl && (
                              <Image
                                src={product.imageUrl}
                                alt={isArabic ? product.nameAr : product.nameEn}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 50vw, 25vw"
                              />
                            )}
                            {product.badge && (
                              <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                                {product.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">
                            {isArabic ? product.nameAr : product.nameEn}
                          </p>
                          {product.price && (
                            <p className="text-sm text-gray-500">
                              AED {product.price.toLocaleString()}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase">
                        <Clock className="h-4 w-4" />
                        {isArabic ? "عمليات البحث الأخيرة" : "Recent Searches"}
                      </div>
                      <button
                        onClick={handleClearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        {isArabic ? "مسح الكل" : "Clear all"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search) => (
                        <button
                          key={search.query}
                          onClick={() => handleRecentSearchClick(search.query)}
                          className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                        >
                          {search.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
