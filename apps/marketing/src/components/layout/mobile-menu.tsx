"use client";

import { useState, useEffect, useMemo } from "react";
import { Menu, X, ChevronRight, Search, User, Globe } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const isArabic = locale === "ar";

  // Close menu when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
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

  const navItems = useMemo(() => [
    { label: isArabic ? "من نحن" : "About Us", href: "/about" },
    { label: isArabic ? "عرض الكل" : "Shop All", href: "/collections/all-products" },
    { label: isArabic ? "المجموعات" : "Collections", href: "/collections" },
    { label: isArabic ? "سياسة الاستبدال" : "Return Policy", href: "/return-policy" },
    { label: isArabic ? "تواصل معنا" : "Contact Us", href: "/contact" },
  ], [isArabic]);

  return (
    <>
      <button
        className="p-2 -ml-2 text-black hover:opacity-60 transition-opacity"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 stroke-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-100">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ x: isArabic ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`absolute inset-y-0 ${isArabic ? "right-0" : "left-0"} w-[85%] max-w-sm bg-white shadow-2xl flex flex-col`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-50">
                <span className="text-xs font-medium uppercase tracking-[0.3em]">
                  {isArabic ? "القائمة" : "Menu"}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-black hover:opacity-60 transition-opacity"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6 stroke-1" />
                </button>
              </div>

              {/* Enhanced Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {/* Secondary Actions Row */}
                <div className="grid grid-cols-2 border-b border-gray-50">
                  <Link 
                    href={isAuthenticated ? "/account" : "/auth/signin"}
                    className="flex flex-col items-center justify-center py-8 gap-2 hover:bg-gray-50 transition-colors border-r border-gray-50"
                  >
                    <User className="h-5 w-5 stroke-1" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                      {isArabic ? "حسابي" : "Account"}
                    </span>
                  </Link>
                  <Link 
                    href={isArabic ? "/en" : "/ar"}
                    className="flex flex-col items-center justify-center py-8 gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <Globe className="h-5 w-5 stroke-1" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                      {isArabic ? "English" : "العربية"}
                    </span>
                  </Link>
                </div>

                {/* Primary Nav */}
                <nav className="py-8">
                  <div className="flex flex-col">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-center justify-between px-8 py-5 border-b border-gray-50/50 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="text-[13px] font-medium uppercase tracking-[0.2em] group-hover:pl-2 transition-all">
                          {item.label}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-gray-200 transition-transform group-hover:translate-x-1 ${isArabic ? "rotate-180" : ""}`} />
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-gray-50 bg-gray-50/30">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed text-center">
                  © 2026 capella luxury jewellery.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}


