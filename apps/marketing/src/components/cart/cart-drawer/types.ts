export interface CartDrawerProps {
  locale: string;
}

export interface SuggestedProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  variants: Array<{
    price: number;
    compareAtPrice?: number | null;
    images?: Array<{ url: string }>;
  }>;
}

export interface CartItemRowProps {
  item: any;
  locale: string;
  onClose: () => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}

export interface SuggestedItemProps {
  product: SuggestedProduct;
  locale: string;
  onClose: () => void;
}

export interface DrawerFooterProps {
  total: number;
  itemCount: number;
  onClose: () => void;
}
