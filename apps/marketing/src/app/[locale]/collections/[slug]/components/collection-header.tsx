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

function GridIcon({
  cols,
  gridColumns,
  onClick,
}: {
  cols: number;
  gridColumns: number;
  onClick: () => void;
}) {
  const dots = [];
  // Generate correct number of dots: 1 for 1 col, 4 for 2 cols, 9 for 3 cols, 16 for 4 cols
  const size = cols === 1 ? 1 : cols === 2 ? 2 : cols === 3 ? 3 : 4;
  for (let i = 0; i < size * size; i++) {
    dots.push(
      <div
        key={i}
        className={`w-1 h-1 rounded-full ${gridColumns === cols ? "bg-black" : "bg-gray-400"}`}
      />
    );
  }
  return (
    <button
      onClick={onClick}
      className="p-1.5 grid gap-0.5 hover:opacity-70 transition"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {dots}
    </button>
  );
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

      {/* Grid View Toggle - Hidden on mobile, visible on tablets and up */}
      <div className="hidden md:flex items-center gap-1">
        <GridIcon cols={1} gridColumns={gridColumns} onClick={() => setGridColumns(1)} />
        <GridIcon cols={2} gridColumns={gridColumns} onClick={() => setGridColumns(2)} />
        <GridIcon cols={3} gridColumns={gridColumns} onClick={() => setGridColumns(3)} />
        <GridIcon cols={4} gridColumns={gridColumns} onClick={() => setGridColumns(4)} />
      </div>

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
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition ${
                    sortOption === option.value ? "font-semibold text-red-600" : ""
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
