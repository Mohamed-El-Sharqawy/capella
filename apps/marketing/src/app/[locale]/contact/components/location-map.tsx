"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { MAP_CONFIG } from "../constants";

export function LocationMap() {
  const t = useTranslations("contact");

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">{t("ourLocation")}</h2>
      <div className="rounded-xl overflow-hidden">
        <iframe
          src={MAP_CONFIG.embedUrl}
          width="100%"
          height={MAP_CONFIG.height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={t("mapTitle")}
        />
      </div>
      <a
        href={MAP_CONFIG.directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-4 text-sm text-orange-500 hover:text-orange-600 transition"
      >
        <MapPin className="h-4 w-4" />
        {t("getDirections")}
      </a>
    </div>
  );
}
