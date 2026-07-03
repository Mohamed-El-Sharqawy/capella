// Shipping rules live in shared-utils so frontend, backend and CMS stay in sync.
export {
  SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  getShippingCost,
} from "@ecommerce/shared-utils";

export const CHECKOUT_ROUTES = {
  CART: "/cart",
  COLLECTIONS: "/collections",
  ACCOUNT_ORDERS: "/account?tab=orders",
  SIGNIN: "/auth/signin",
} as const;

export const DEFAULT_COUNTRY = "United Arab Emirates";
export const DEFAULT_ZIP_CODE = "00000";
