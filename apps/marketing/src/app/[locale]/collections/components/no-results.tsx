"use client";

import { useTranslations } from "next-intl";

interface NoResultsProps {
  query: string;
  onClear: () => void;
}

export function NoResults({ query, onClear }: NoResultsProps) {
  const t = useTranslations("collection");

  return (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">
        {t("noResults")} "{query}"
      </p>
      <button onClick={onClear} className="mt-4 text-sm text-black underline hover:no-underline">
        {t("clearSearch")}
      </button>
    </div>
  );
}
