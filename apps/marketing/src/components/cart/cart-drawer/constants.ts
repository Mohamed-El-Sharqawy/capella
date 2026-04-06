export const SUGGESTED_PRODUCTS_LIMIT = 2;
export const COLLECTION_FETCH_LIMIT = 4;
export const PARENT_COLLECTION_LIMIT = 6;
export const FEATURED_FALLBACK_LIMIT = 2;

export const DRAWER_CLASSES = {
  backdrop: "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
  drawer: "fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col",
} as const;
