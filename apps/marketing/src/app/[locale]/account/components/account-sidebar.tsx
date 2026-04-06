"use client";

import {
  User,
  Heart,
  Bookmark,
  ShoppingBag,
  Package,
  LogOut,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { TabType } from "../types";

interface TabItem {
  id: TabType;
  count?: number;
}

interface AccountSidebarProps {
  locale: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onSignOut: () => void;
  tabs: TabItem[];
}

const ICONS: Record<TabType, React.ReactNode> = {
  profile: <User className="h-4 w-4" />,
  orders: <Package className="h-4 w-4" />,
  favourites: <Heart className="h-4 w-4" />,
  wishlist: <Bookmark className="h-4 w-4" />,
  cart: <ShoppingBag className="h-4 w-4" />,
  addresses: <MapPin className="h-4 w-4" />,
};

export function AccountSidebar({ locale, activeTab, onTabChange, onSignOut, tabs }: AccountSidebarProps) {
  const t = useTranslations("account");
  const isArabic = locale === "ar";

  const getTabLabel = (tabId: TabType): string => {
    switch (tabId) {
      case "profile": return t("profile");
      case "orders": return t("orders");
      case "favourites": return t("favourites");
      case "wishlist": return t("wishlist");
      case "cart": return t("cart");
      case "addresses": return t("addresses");
      default: return tabId;
    }
  };

  return (
    <nav className="space-y-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
            activeTab === tab.id
              ? "bg-black text-white"
              : "hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-2">
            {ICONS[tab.id]}
            {getTabLabel(tab.id)}
          </span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === tab.id ? "bg-white text-black" : "bg-gray-200"
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
      <hr className="my-2" />
      <button
        onClick={onSignOut}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
      >
        <LogOut className="h-4 w-4" />
        {t("signOut")}
      </button>
    </nav>
  );
}
