import { Collection } from "./category";

export enum Gender {
  MEN = "MEN",
  WOMEN = "WOMEN",
  UNISEX = "UNISEX",
}

export interface Color {
  id: string;
  nameEn: string;
  nameAr: string;
  hex: string;
}

export interface Size {
  id: string;
  nameEn: string;
  nameAr: string;
  position: number;
}

// Product-level image (the actual file stored in Cloudinary)
export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId: string;
  altEn?: string | null;
  altAr?: string | null;
  createdAt: Date;
}

// Junction table: links images to variants with position
export interface ProductVariantImage {
  id: string;
  imageId: string;
  variantId: string;
  position: number;
  image?: ProductImage; // Included when fetching variant images
}

// Flattened image for frontend convenience (combines ProductImage + position)
export interface VariantImageWithDetails {
  id: string; // ProductVariantImage id
  imageId: string;
  url: string;
  publicId: string;
  altEn?: string | null;
  altAr?: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  colorId?: string | null;
  color?: Color | null;
  sizeId?: string | null;
  size?: Size | null;
  stock: number;
  isActive: boolean;
  metaTitleEn?: string | null;
  metaTitleAr?: string | null;
  metaDescriptionEn?: string | null;
  metaDescriptionAr?: string | null;
  images: VariantImageWithDetails[]; // Flattened images with position
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  shortDescriptionEn?: string | null;
  shortDescriptionAr?: string | null;
  metaTitleEn?: string | null;
  metaTitleAr?: string | null;
  metaDescriptionEn?: string | null;
  metaDescriptionAr?: string | null;
  gender: Gender;
  isActive: boolean;
  isFeatured: boolean;
  collectionId?: string | null;
  sizeGuideUrl?: string | null;
  defaultVariantId?: string | null;
  defaultVariant?: ProductVariant | null;
  hoverVariantId?: string | null;
  hoverVariant?: ProductVariant | null;
  variants: ProductVariant[];
  images: ProductImage[]; // Product-level images that can be shared across variants
  createdAt: Date;
  updatedAt: Date;
  collection: Collection;
}

export interface ProductFilters {
  gender?: Gender;
  collectionId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
