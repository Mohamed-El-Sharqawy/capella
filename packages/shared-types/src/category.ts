export interface CollectionImage {
  id: string;
  url: string;
  publicId: string;
  altEn?: string | null;
  altAr?: string | null;
}

export interface Collection {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  metaTitleEn?: string | null;
  metaTitleAr?: string | null;
  metaDescriptionEn?: string | null;
  metaDescriptionAr?: string | null;
  image?: CollectionImage | null;
  isActive: boolean;
  inHeader?: boolean;
  isFeaturedOnHome?: boolean;
  homeFeaturedPosition?: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { products: number };
}

export interface CollectionWithProducts extends Collection {
  products?: import("./product").Product[];
  _count: { products: number };
}
