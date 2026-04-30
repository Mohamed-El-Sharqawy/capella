"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Menu, X, ChevronRight, ChevronLeft, User, Globe } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { SearchOverlay } from "./search-overlay";
import { LanguageSwitcher } from "./language-switcher";

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

type NavLevel = "main" | "collectionsSub" | "singleCollection";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState<NavLevel>("main");
  const [activeCollection, setActiveCollection] = useState<HeaderCollection | null>(null);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const isArabic = locale === "ar";

  const { data: headerCollections = [] } = useQuery({
    queryKey: ["header-collections"],
    queryFn: fetchHeaderCollections,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset level when closing or changing route
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setLevel("main");
        setActiveCollection(null);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? (isArabic ? "-100%" : "100%") : (isArabic ? "100%" : "-100%"),
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? (isArabic ? "-100%" : "100%") : (isArabic ? "100%" : "-100%"),
      opacity: 0,
    }),
  };

  const navContent = useMemo(() => {
    switch (level) {
      case "collectionsSub":
        return (
          <div className="flex flex-col h-full bg-[#F2F2F2]">
            <button
              onClick={() => setLevel("main")}
              className="flex items-center gap-2 p-6 text-[11px] uppercase tracking-[0.2em] font-medium text-black/60 hover:text-black transition-colors"
            >
              <ChevronLeft className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
              {isArabic ? "العودة" : "Back"}
            </button>
            <div className="px-6 py-4 space-y-8">
              <Link href="/collections" className="block text-2xl font-light tracking-widest hover:opacity-60 transition-opacity">
                {isArabic ? "عرض الكل" : "Shop All"}
              </Link>
              {headerCollections.map((collection) => (
                <div key={collection.id} className="space-y-4">
                  {collection.children && collection.children.length > 0 ? (
                    <button
                      onClick={() => {
                        setActiveCollection(collection);
                        setLevel("singleCollection");
                      }}
                      className="w-full flex items-center justify-between text-2xl font-light tracking-widest hover:opacity-60 transition-all group text-start"
                    >
                      <span>{isArabic ? collection.nameAr : collection.nameEn}</span>
                      <ChevronRight className={`h-5 w-5 text-black/20 group-hover:text-black transition-colors ${isArabic ? "rotate-180" : ""}`} />
                    </button>
                  ) : (
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="block text-2xl font-light tracking-widest hover:opacity-60 transition-opacity"
                    >
                      {isArabic ? collection.nameAr : collection.nameEn}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "singleCollection":
        return (
          <div className="flex flex-col h-full bg-[#F2F2F2]">
            <button
              onClick={() => setLevel("collectionsSub")}
              className="flex items-center gap-2 p-6 text-[11px] uppercase tracking-[0.2em] font-medium text-black/60 hover:text-black transition-colors"
            >
              <ChevronLeft className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
              {isArabic ? "العودة" : "Back"}
            </button>
            <div className="px-6 py-4 space-y-8">
              <Link
                href={`/collections/${activeCollection?.slug}`}
                className="block text-2xl border-b border-black/5 pb-4 font-light tracking-widest hover:opacity-60 transition-opacity"
              >
                {isArabic ? `عرض الكل في ${activeCollection?.nameAr}` : `Shop All ${activeCollection?.nameEn}`}
              </Link>
              {activeCollection?.children?.map((child) => (
                <Link
                  key={child.id}
                  href={`/collections/${child.slug}`}
                  className="block text-2xl font-light tracking-widest hover:opacity-100 transition-opacity"
                >
                  {isArabic ? child.nameAr : child.nameEn}
                </Link>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col h-full bg-[#F2F2F2]">
            {/* Header Area */}
            <div className="h-20 flex items-center justify-end px-6">
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 ${isArabic ? "-mr-2" : "-ml-2"} text-black hover:opacity-60 transition-opacity`}
                aria-label="Close menu"
              >
                <X className="h-7 w-7 stroke-1" />
              </button>
            </div>

            <div className="flex-1 px-8 py-10 space-y-8">
              {/* Collections Header */}
              <div className="space-y-6">
                {/* shop all */}
                <Link
                  href={`/collections`}
                  className="flex items-center justify-between text-xl font-light tracking-widest opacity-60 hover:opacity-100 transition-opacity pl-2"
                >
                  {isArabic ? "تسوق الكل" : "Shop All"}
                  <ChevronRight className={`h-4 w-4 text-black/15 group-hover:text-black transition-colors ${isArabic ? "rotate-180" : ""}`} />
                </Link>
                <div className="space-y-4">
                  {headerCollections.map((collection) => (
                    <div key={collection.id}>
                      {collection.children && collection.children.length > 0 ? (
                        <button
                          onClick={() => {
                            setActiveCollection(collection);
                            setLevel("singleCollection");
                          }}
                          className="w-full flex items-center justify-between text-2xl font-medium tracking-widest hover:opacity-100 transition-all opacity-90 group text-start"
                        >
                          <span>{isArabic ? collection.nameAr : collection.nameEn}</span>
                          <ChevronRight className={`h-5 w-5 text-black/30 group-hover:text-black transition-colors ${isArabic ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <Link
                          href={`/collections/${collection.slug}`}
                          className="flex items-center justify-between text-xl font-light tracking-widest opacity-60 hover:opacity-100 transition-opacity pl-2"
                        >
                          {isArabic ? collection.nameAr : collection.nameEn}
                          <ChevronRight className={`h-4 w-4 text-black/15 group-hover:text-black transition-colors ${isArabic ? "rotate-180" : ""}`} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/" className="block text-3xl font-light tracking-widest opacity-80 hover:opacity-100 transition-opacity">
                {isArabic ? "الرئيسية" : "Home"}
              </Link>

              <Link href="/about" className="block text-3xl font-light tracking-widest opacity-80 hover:opacity-100 transition-opacity">
                {isArabic ? "من نحن" : "About Us"}
              </Link>

              <Link href="/contact" className="block text-3xl font-light tracking-widest opacity-80 hover:opacity-100 transition-opacity">
                {isArabic ? "اتصل بنا" : "Contact Us"}
              </Link>
            </div>

            {/* Footer Area - Enhanced Action Icons */}
            <div className="mt-auto py-8 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-8 px-8">
                {/* Search */}
                <div className="flex flex-col items-center gap-2.5 group cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.06] flex items-center justify-center group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300">
                    <SearchOverlay />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.15em] text-black/40 font-medium">
                    {isArabic ? "بحث" : "SEARCH"}
                  </span>
                </div>

                {/* Language */}
                <div className="flex flex-col items-center gap-2.5 group">
                  <LanguageSwitcher
                    trigger={
                      <div className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.06] flex items-center justify-center group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer">
                        <Image
                          src={isArabic ? "https://flagcdn.com/w40/ae.png" : "https://flagcdn.com/w40/us.png"}
                          alt="Language"
                          width={20}
                          height={15}
                          className="rounded-sm"
                        />
                      </div>
                    }
                  />
                  <span className="text-[9px] uppercase tracking-[0.15em] text-black/40 font-medium">
                    {isArabic ? "اللغة" : "LANGUAGE"}
                  </span>
                </div>

                {/* Account */}
                <div className="flex flex-col items-center gap-2.5 group">
                  <Link
                    href="/auth/signin"
                    className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.06] flex items-center justify-center group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300"
                  >
                    <User className="h-5 w-5 stroke-[1.5] text-black/70" />
                  </Link>
                  <span className="text-[9px] uppercase tracking-[0.15em] text-black/40 font-medium">
                    {isArabic ? "الحساب" : "ACCOUNT"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  }, [level, isArabic, headerCollections, activeCollection, t]);

  return (
    <>
      <button
        className={`p-2 ${isArabic ? "-mr-2" : "-ml-2"} text-black hover:opacity-60 transition-opacity`}
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 stroke-1" />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              style={{ zIndex: 99999 }}
              className={`fixed inset-0 flex ${isArabic ? "justify-end" : "justify-start"}`}
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-white backdrop-blur-sm"
              />

              {/* Sheet */}
              <motion.div
                dir={isArabic ? "rtl" : "ltr"}
                initial={{ x: isArabic ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isArabic ? "100%" : "-100%" }}
                transition={{ type: "tween", duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="relative h-full w-[90%] max-w-sm bg-[#F2F2F2] shadow-2xl flex flex-col overflow-hidden text-start"
              >
                {/* Close Button Header */}
                {/* <div
                  style={{ top: 32 }}
                  className={`absolute ${isArabic ? "right-0" : "left-0"} p-6 z-10`}
                >
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 ${isArabic ? "-mr-2" : "-ml-2"} text-black hover:opacity-60 transition-opacity`}
                    aria-label="Close menu"
                  >
                    <X className="h-7 w-7 stroke-1" />
                  </button>
                </div> */}

                <div className="flex-1 overflow-y-auto mt-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={level}
                      custom={level === "main" ? -1 : 1}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      className="min-h-full"
                    >
                      {navContent}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
