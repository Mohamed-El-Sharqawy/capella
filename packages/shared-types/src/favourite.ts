import type { Product } from "./product";

export interface Favourite {
  id: string;
  userId: string;
  productId: string;
  product: Pick<Product, "id" | "nameEn" | "nameAr" | "slug" | "variants" | "defaultVariant">;
  createdAt: Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  note?: string | null;
  product: Pick<Product, "id" | "nameEn" | "nameAr" | "slug" | "variants" | "defaultVariant">;
  createdAt: Date;
}
