import type { Product, ProductVariant } from "@ecommerce/shared-types";

export interface ProductPageClientProps {
  product: Product;
  relatedProducts: Product[];
  locale: string;
}

export interface UniqueColor {
  id: string;
  hex: string;
  nameEn: string;
  nameAr: string;
  variantId: string;
}

export interface UniqueSize {
  id: string;
  nameEn: string;
  nameAr: string;
  position: number;
  variantId: string;
}

export interface SizeAvailability {
  available: boolean;
  inStock: boolean;
  stock: number;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  customerName?: string;
  userId?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
  relatedProducts: Product[];
  locale: string;
  selectedVariant: ProductVariant | null;
}
