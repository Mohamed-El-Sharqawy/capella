import type { ProductVariant } from "./product";

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: ProductVariant & {
    product: {
      id: string;
      nameEn: string;
      nameAr: string;
      slug: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}
