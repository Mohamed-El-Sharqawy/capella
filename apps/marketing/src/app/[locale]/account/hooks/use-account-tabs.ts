"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { TabType, AccountTabsState, AccountTabsHandlers } from "../types";
import { VALID_TABS } from "../constants";

export function useAccountTabs(): { state: AccountTabsState; handlers: AccountTabsHandlers } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialTab = useCallback((): TabType => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam as TabType)) {
      return tabParam as TabType;
    }
    return "profile";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [ordersPage, setOrdersPage] = useState(1);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setOrdersPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return {
    state: { activeTab, ordersPage },
    handlers: { handleTabChange, setOrdersPage },
  };
}
