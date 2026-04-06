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
