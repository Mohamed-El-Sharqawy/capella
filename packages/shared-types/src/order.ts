export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export interface OrderItem {
  id: string;
  variantId: string;
  productNameEn: string;
  productNameAr: string;
  variantNameEn: string;
  variantNameAr: string;
  sku?: string | null;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  imageUrl?: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  shippingAmount?: number;
  paymentMethod?: string | null;
  ziinaPaymentIntentId?: string | null;
  tabbyPaymentId?: string | null;
  tamaraCheckoutId?: string | null;
  paidAt?: Date | null;
  discountAmount?: number;
  couponId?: string | null;
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  } | null;
  guestEmail?: string | null;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  guestPhone?: string | null;
  addressId?: string | null;
  shippingFirstName: string;
  shippingLastName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  shippingPhone?: string | null;
  note?: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  label?: string | null;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
}
