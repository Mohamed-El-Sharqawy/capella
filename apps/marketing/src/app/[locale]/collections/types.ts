import type { Collection, Product } from "@ecommerce/shared-types";

export interface CollectionsPageClientProps {
  collections: Collection[];
  locale: string;
}

export interface SearchProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number | null;
  imageUrl: string | null;
}

export interface StaticCollection {
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string;
}
