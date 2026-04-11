import type { StaticCollection } from "./types";

export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

export const STATIC_COLLECTIONS: StaticCollection[] = [
  {
    slug: "all-products",
    nameEn: "All Products",
    nameAr: "جميع المنتجات",
    imageUrl: "/static-collections/assets/all-products.jpeg",
  },
];
