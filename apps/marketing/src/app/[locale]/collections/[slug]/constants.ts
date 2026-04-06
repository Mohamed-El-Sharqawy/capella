export const PRODUCTS_PER_PAGE = 32;
export const DEFAULT_GRID_COLUMNS = 4;
export const DEFAULT_SORT = "featured";
export const DEFAULT_MIN_PRICE = 0;
export const DEFAULT_MAX_PRICE = 5000;
export const PRICE_DEBOUNCE_MS = 500;

export const SORT_OPTIONS_DATA: Record<string, { sortBy: string; sortOrder: string }> = {
  featured: { sortBy: "isFeatured", sortOrder: "desc" },
  "best-selling": { sortBy: "createdAt", sortOrder: "desc" },
  "alpha-asc": { sortBy: "nameEn", sortOrder: "asc" },
  "alpha-desc": { sortBy: "nameEn", sortOrder: "desc" },
  "price-asc": { sortBy: "price", sortOrder: "asc" },
  "price-desc": { sortBy: "price", sortOrder: "desc" },
  "date-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "date-desc": { sortBy: "createdAt", sortOrder: "desc" },
} as const;

export const GRID_COLS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
} as const;
