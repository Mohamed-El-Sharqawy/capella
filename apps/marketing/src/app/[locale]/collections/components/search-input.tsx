"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isSearching: boolean;
  locale: string;
}

export function SearchInput({ value, onChange, isSearching, locale }: SearchInputProps) {
  const t = useTranslations("collection");
  const isArabic = locale === "ar";

  return (
    <div className="max-w-md mx-auto mb-10 md:mb-14">
      <div className="relative">
        <Search className={`absolute ${isArabic ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={`w-full ${isArabic ? "pr-11 pl-4" : "pl-11 pr-4"} py-3 border-b border-neutral-300 bg-transparent focus:outline-none focus:border-black text-sm transition-colors`}
          dir={isArabic ? "rtl" : "ltr"}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className={`absolute ${isArabic ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full transition`}
          >
            <X className="h-3.5 w-3.5 text-neutral-400" />
          </button>
        )}
      </div>
      {isSearching && (
        <div className="flex items-center justify-center mt-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
          <span className="ml-2 text-xs text-neutral-500">{t("searching")}</span>
        </div>
      )}
    </div>
  );
}
