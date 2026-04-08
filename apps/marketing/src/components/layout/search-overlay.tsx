"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

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
}

interface SearchResults {
  products: SearchProduct[];
  collections: SearchCollection[];
}

export function SearchOverlay() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return { products: [], collections: [] };
      return apiGet<SearchResults>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const overlayContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 flex justify-end overflow-hidden"
          style={{ zIndex: 999999 }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: isArabic ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isArabic ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col ${isArabic ? "mr-auto" : "ml-auto"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isArabic ? "ابحث هنا..." : "Search product..."}
                  className="flex-1 bg-transparent border-none outline-none text-[11px] uppercase tracking-wider text-gray-900 placeholder:text-gray-300"
                  dir={isArabic ? "rtl" : "ltr"}
                />
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <X className="h-5 w-5 stroke-1" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {debouncedQuery.length >= 2 ? (
                <div className="space-y-12">
                  {/* Products Results */}
                  {results?.products && results.products.length > 0 && (
                    <div className="space-y-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Products</p>
                      <div className="grid gap-6">
                        {results.products.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={handleClose}
                            className="flex gap-4 group"
                          >
                            <div className="h-20 w-16 bg-gray-50 relative overflow-hidden rounded-sm">
                              {product.imageUrl && (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.nameEn}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <h4 className="text-[11px] uppercase tracking-wider font-medium text-gray-900 truncate">
                                {isArabic ? product.nameAr : product.nameEn}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-1">AED {product.price?.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                              <ArrowRight className="h-4 w-4 text-gray-300 transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collections Results */}
                  {results?.collections && results.collections.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Collections</p>
                      <div className="flex flex-col gap-2">
                        {results.collections.map((coll) => (
                          <Link
                            key={coll.id}
                            href={`/collections/${coll.slug}`}
                            onClick={handleClose}
                            className="text-[11px] uppercase tracking-widest text-gray-600 hover:text-black hover:pl-2 transition-all"
                          >
                            {isArabic ? coll.nameAr : coll.nameEn}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isLoading && results?.products.length === 0 && results?.collections.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">No results found for "{debouncedQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center p-6 bg-gray-50 rounded-full mb-6">
                      <Search className="h-8 w-8 text-gray-200 stroke-1" />
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-light">Start typing to search Products...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button onClick={handleOpen} className="p-2 hover:opacity-60 transition-opacity" aria-label="Search">
        <Search className="h-5 w-5 stroke-1" />
      </button>

      {mounted && createPortal(overlayContent, document.body)}
    </>
  );
}

