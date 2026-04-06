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
    <div className="max-w-md mx-auto mb-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-12 pr-12 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-black text-sm"
          dir={isArabic ? "rtl" : "ltr"}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      {isSearching && (
        <div className="flex items-center justify-center mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">{t("searching")}</span>
        </div>
      )}
    </div>
  );
}
