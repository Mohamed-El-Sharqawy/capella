export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const USER_ROLES = ["ADMIN", "EDITOR", "CUSTOMER", "GUEST"] as const;

export const GENDERS = ["MEN", "WOMEN", "UNISEX"] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const PRODUCT_BADGES = ["NEW", "BESTSELLER", "LIMITED_EDITION"] as const;

export const PAYMENT_METHODS = ["ZIINA", "COD"] as const;

// --- Shipping (AED) ---
/** Flat shipping fee in AED for orders below the free-shipping threshold. */
export const SHIPPING_COST = 25;
/** Orders with a subtotal at or above this amount (AED) ship for free. */
export const FREE_SHIPPING_THRESHOLD = 600;

/**
 * Compute the shipping cost for an order based on its subtotal (the value of
 * items, before any discount). At or above FREE_SHIPPING_THRESHOLD shipping is
 * free (0), otherwise the flat SHIPPING_COST applies.
 */
export function getShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export const API_ROUTES = {
  AUTH: {
    SIGN_IN: "/api/auth/sign-in",
    SIGN_UP: "/api/auth/sign-up",
    REFRESH: "/api/auth/refresh",
  },
  USERS: "/api/users",
  PRODUCTS: "/api/products",
  COLLECTIONS: "/api/collections",
  ORDERS: "/api/orders",
  CART: "/api/cart",
  FAVOURITES: "/api/favourites",
  WISHLIST: "/api/wishlist",
  IMAGES: "/api/images",
} as const;
