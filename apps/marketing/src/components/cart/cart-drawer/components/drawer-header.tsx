"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface DrawerHeaderProps {
  onClose: () => void;
}

export function DrawerHeader({ onClose }: DrawerHeaderProps) {
  const t = useTranslations("cartDrawer");

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-100 rounded-full transition"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
