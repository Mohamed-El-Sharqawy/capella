"use client";

import { Phone } from "lucide-react";
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
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("lastName")} *</label>
          <input
            type="text"
            value={formState.lastName}
            onChange={(e) => onUpdateField("lastName", e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")} *</label>
          <input
            type="email"
            value={formState.email}
            onChange={(e) => onUpdateField("email", e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("phone")} *</label>
          <div className="flex gap-2" dir="ltr">
            <input
              type="tel"
              value="+971"
              readOnly
              className="w-20 px-3 py-3 border rounded-lg bg-gray-50 text-sm font-medium text-muted-foreground"
            />
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                value={formState.phone}
                onChange={(e) => {
                  // UAE mobile only: digits, must start with 5, max 9 digits
                  // (5 + 8) — the full national number after +971.
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length > 0 && !val.startsWith("5")) return;
                  if (val.length > 9) return;
                  onUpdateField("phone", val);
                }}
                placeholder="5X XXX XXXX"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
