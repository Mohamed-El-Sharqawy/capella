"use client";

import { useTranslations } from "next-intl";
import type { FaqItem } from "../types";

interface FaqSectionProps {
  faqs: FaqItem[];
}

export function FaqSection({ faqs }: FaqSectionProps) {
  const t = useTranslations("contact");

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-center mb-8">{t("faq.title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-2">{faq.q}</h3>
            <p className="text-gray-600 text-sm">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
