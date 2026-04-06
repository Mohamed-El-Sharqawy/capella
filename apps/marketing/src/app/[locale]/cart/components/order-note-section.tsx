"use client";

import { useTranslations } from "next-intl";

interface OrderNoteSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function OrderNoteSection({ value, onChange }: OrderNoteSectionProps) {
  const t = useTranslations("cart");

  return (
    <div className="mt-8">
      <h3 className="font-medium mb-2">{t("orderNote")}</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("orderNotePlaceholder")}
        rows={3}
        className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
      />
    </div>
  );
}
