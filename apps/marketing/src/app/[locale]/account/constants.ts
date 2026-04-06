import type { TabType } from "./types";

export const ORDERS_PER_PAGE = 5;

export const VALID_TABS: TabType[] = ["profile", "orders", "favourites", "wishlist", "cart", "addresses"];

export const TAB_ICONS = {
  profile: "User",
  orders: "Package",
  favourites: "Heart",
  wishlist: "Bookmark",
  cart: "ShoppingBag",
  addresses: "MapPin",
} as const;

export const TAB_LABELS = {
  profile: { en: "Profile", ar: "الملف الشخصي" },
  orders: { en: "Orders", ar: "الطلبات" },
  favourites: { en: "Favourites", ar: "المفضلة" },
  wishlist: { en: "Wishlist", ar: "قائمة الرغبات" },
  cart: { en: "Cart", ar: "السلة" },
  addresses: { en: "Addresses", ar: "العناوين" },
} as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800",
};

export function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status.toLowerCase()] || ORDER_STATUS_COLORS.default;
}
