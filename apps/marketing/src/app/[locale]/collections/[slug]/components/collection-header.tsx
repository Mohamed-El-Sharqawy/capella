"use client";

import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SortOption, GridColumns } from "../types";

interface CollectionHeaderProps {
  sortOption: string;
  sortOptions: SortOption[];
  onSortChange: (value: string) => void;
  isSortOpen: boolean;
  setIsSortOpen: (open: boolean) => void;
  gridColumns: number;
  setGridColumns: (cols: GridColumns) => void;
  onFilterOpen: () => void;
}

export function CollectionHeader({
  sortOption,
  sortOptions,
  onSortChange,
  isSortOpen,
  setIsSortOpen,
  gridColumns,
  setGridColumns,
  onFilterOpen,
}: CollectionHeaderProps) {
  const t = useTranslations("collection");

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Filter Button */}
      <button
        onClick={onFilterOpen}
        className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t("filter")}
      </button>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition min-w-[140px] justify-between border px-3 py-2 rounded"
        >
          {sortOptions.find((s) => s.value === sortOption)?.label}
          <ChevronDown className={`h-4 w-4 transition ${isSortOpen ? "rotate-180" : ""}`} />
        </button>
        {isSortOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[200px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition ${sortOption === option.value ? "font-semibold text-red-600" : ""
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
