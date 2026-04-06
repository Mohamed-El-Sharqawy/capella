"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
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

  const navItems = [
    { label: isArabic ? "من نحن" : "About", href: "/about" },
    { label: t("shopAll"), href: "/collections/all-products" },
    { label: t("shopByCollection"), href: "/collections" },
    { label: t("returnPolicy"), href: "/return-policy" },
    { label: t("contactUs"), href: "/contact" },
  ];

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
          <div className="fixed inset-0 z-60">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
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
                <span className="text-sm font-light uppercase tracking-[0.3em]">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-black hover:opacity-60 transition-opacity"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6 stroke-1" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-8">
                <div className="flex flex-col">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center justify-between px-8 py-4 border-b border-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[13px] font-medium uppercase tracking-[0.2em] group-hover:pl-2 transition-all">
                        {item.label}
                      </span>
                      <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 ${isArabic ? "rotate-180" : ""}`} />
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Footer inside menu */}
              <div className="p-8 border-t border-gray-50 bg-gray-50/30">
                <div className="space-y-4">
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                    © 2026 capella luxury jewellery.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

