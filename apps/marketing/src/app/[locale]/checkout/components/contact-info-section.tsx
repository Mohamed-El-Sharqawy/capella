"use client";

import { useTranslations } from "next-intl";
import type { CheckoutFormState } from "../types";

interface ContactInfoSectionProps {
  formState: CheckoutFormState;
  onUpdateField: (field: keyof CheckoutFormState, value: string) => void;
}

export function ContactInfoSection({ formState, onUpdateField }: ContactInfoSectionProps) {
  const t = useTranslations("checkout");

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">
          1
        </span>
        {t("contactInfo")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("firstName")} *</label>
          <input
            type="text"
            value={formState.firstName}
            onChange={(e) => onUpdateField("firstName", e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("lastName")} *</label>
          <input
            type="text"
            value={formState.lastName}
            onChange={(e) => onUpdateField("lastName", e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")} *</label>
          <input
            type="email"
            value={formState.email}
            onChange={(e) => onUpdateField("email", e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("phone")} *</label>
          <input
            type="tel"
            value={formState.phone}
            onChange={(e) => onUpdateField("phone", e.target.value)}
            required
            placeholder="+20 1XX XXX XXXX"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>
    </div>
  );
}
