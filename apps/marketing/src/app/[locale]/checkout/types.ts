export interface CheckoutPageClientProps {
  locale: string;
}

export interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface BuyNowItem {
  variantId: string;
  productId: string;
  quantity: number;
  productNameEn: string;
  productNameAr: string;
  variantNameEn: string;
  variantNameAr: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  colorNameEn?: string;
  colorNameAr?: string;
  sizeNameEn?: string;
  sizeNameAr?: string;
}

export interface CheckoutFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  notes: string;
}

export interface CheckoutItem {
  variantId: string;
  productId?: string;
  quantity: number;
  productNameEn: string;
  productNameAr: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  colorNameEn?: string;
  colorNameAr?: string;
  sizeNameEn?: string;
  sizeNameAr?: string;
}
