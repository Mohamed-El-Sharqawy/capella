import type { Product } from "@ecommerce/shared-types";

export type TabType = "profile" | "orders" | "favourites" | "wishlist" | "cart" | "addresses";

export interface TabConfig {
  id: TabType;
  label: string;
  labelAr: string;
  icon: string;
  count?: number;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  street?: string;
  city: string;
  area?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  productNameEn: string;
  productNameAr: string;
  variantNameEn?: string;
  variantNameAr?: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  variantId: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  paymentMethod?: string;
  total: number;
  createdAt: Date | string;
  items?: OrderItem[];
  shippingAddress?: {
    address: string;
    city: string;
    area?: string;
  };
}

export interface AccountPageClientProps {
  locale: string;
}

export interface PhoneEditState {
  isEditing: boolean;
  phone: string;
  isSaving: boolean;
  error: string;
}

export interface PhoneEditHandlers {
  handleEdit: () => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  setPhone: (phone: string) => void;
}

export interface AccountTabsState {
  activeTab: TabType;
  ordersPage: number;
}

export interface AccountTabsHandlers {
  handleTabChange: (tab: TabType) => void;
  setOrdersPage: (page: number) => void;
}

export interface AddressesState {
  addresses: Address[];
  isLoading: boolean;
}

export interface FavouritesTabProps {
  locale: string;
  products: Product[];
  isLoading: boolean;
  onRemove: (productId: string) => void;
}

export interface WishlistTabProps {
  locale: string;
  products: Product[];
  isLoading: boolean;
  wishlistItems: Array<{ productId: string; note?: string }>;
  onRemove: (productId: string) => void;
}

export interface OrdersTabProps {
  locale: string;
  orders: { data: Order[]; meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } };
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export interface ProfileTabProps {
  locale: string;
  phoneEdit: {
    state: PhoneEditState;
    handlers: PhoneEditHandlers;
  };
}

export interface CartTabProps {
  locale: string;
}

export interface AddressesTabProps {
  locale: string;
  addresses: Address[];
  isLoading: boolean;
}
