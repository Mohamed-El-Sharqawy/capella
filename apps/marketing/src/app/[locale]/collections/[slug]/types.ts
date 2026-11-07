import type React from "react";
import type { Product, Collection } from "@ecommerce/shared-types";

export interface CollectionPageClientProps {
  locale: string;
  slug: string;
  title: string;
  collections: Collection[];
  initialProducts: Product[];
  initialMeta: ProductMeta;
  videoUrl?: string | null;
  /** Collection description shown under the heading (plain text or HTML). */
  description?: string | null;
  /** Server-rendered content shown until the interactive page hydrates. */
  fallback?: React.ReactNode;
}

export interface ProductMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SortOption = {
  value: string;
  label: string;
  sortBy: string;
  sortOrder: string;
};

export type GridColumns = 1 | 2 | 3 | 4;

export type AvailabilityFilter = "all" | "inStock" | "outOfStock";
