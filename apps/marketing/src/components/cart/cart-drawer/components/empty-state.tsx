"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

interface EmptyStateProps {
  onClose: () => void;
}

export function EmptyState({ onClose }: EmptyStateProps) {
  const t = useTranslations("cartDrawer");

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
      <p className="text-lg font-medium text-gray-600">{t("empty")}</p>
      <p className="text-sm text-muted-foreground mt-2">{t("emptyDesc")}</p>
      <button
        onClick={onClose}
        className="mt-6 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
      >
        {t("shopNow")}
      </button>
    </div>
  );
}
