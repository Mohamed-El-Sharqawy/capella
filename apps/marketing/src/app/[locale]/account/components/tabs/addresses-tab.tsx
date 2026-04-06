"use client";

import { MapPin, Loader2, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AddressesTabProps } from "../../types";

export function AddressesTab({ locale, addresses, isLoading }: AddressesTabProps) {
  const t = useTranslations("account.addressesTab");
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t("title")} (0)
        </h2>
        <div className="bg-white border rounded-lg p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t("noAddresses")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isArabic
              ? "ستُحفظ العناوين تلقائياً عند إتمام طلبك"
              : "Addresses will be saved automatically when you checkout"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {t("title")} ({addresses.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {addr.firstName} {addr.lastName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {addr.address || addr.street}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addr.city}{addr.area && `, ${addr.area}`}
                </p>
                {addr.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                    <Phone className="h-3 w-3" />
                    {addr.phone}
                  </p>
                )}
              </div>
              {addr.isDefault && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {t("default")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
