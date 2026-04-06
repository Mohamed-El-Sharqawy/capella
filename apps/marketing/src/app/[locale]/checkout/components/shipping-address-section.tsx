"use client";

import { Loader2, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import type { CheckoutFormState, SavedAddress } from "../types";

interface ShippingAddressSectionProps {
  formState: CheckoutFormState;
  onUpdateField: (field: keyof CheckoutFormState, value: string) => void;
  savedAddresses: SavedAddress[];
  isLoadingAddresses: boolean;
  selectedAddressId: string | null;
  onSelectAddress: (addr: SavedAddress | null) => void;
  saveAddress: boolean;
  onSaveAddressChange: (value: boolean) => void;
}

export function ShippingAddressSection({
  formState,
  onUpdateField,
  savedAddresses,
  isLoadingAddresses,
  selectedAddressId,
  onSelectAddress,
  saveAddress,
  onSaveAddressChange,
}: ShippingAddressSectionProps) {
  const t = useTranslations("checkout");
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">
          2
        </span>
        {t("shippingAddress")}
      </h2>

      {/* Saved Addresses */}
      {isAuthenticated && savedAddresses.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t("savedAddresses")}</label>
          {isLoadingAddresses ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <div className="grid gap-3">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => onSelectAddress(addr)}
                  className={`w-full text-left p-4 border rounded-lg transition ${
                    selectedAddressId === addr.id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {addr.firstName} {addr.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{addr.street}</div>
                      <div className="text-sm text-muted-foreground">
                        {addr.city}
                        {addr.state ? `, ${addr.state}` : ""}
                      </div>
                      {addr.phone && (
                        <div className="text-sm text-muted-foreground">{addr.phone}</div>
                      )}
                    </div>
                    {selectedAddressId === addr.id && (
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => onSelectAddress(null)}
                className={`w-full text-left p-4 border rounded-lg transition ${
                  selectedAddressId === null
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">+</span>
                  <span>{t("newAddress")}</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("address")} *</label>
          <input
            type="text"
            value={formState.address}
            onChange={(e) => onUpdateField("address", e.target.value)}
            required
            placeholder={t("addressPlaceholder")}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("city")} *</label>
            <input
              type="text"
              value={formState.city}
              onChange={(e) => onUpdateField("city", e.target.value)}
              required
              placeholder={t("cityPlaceholder")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("area")}</label>
            <input
              type="text"
              value={formState.area}
              onChange={(e) => onUpdateField("area", e.target.value)}
              placeholder={t("areaPlaceholder")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("deliveryNotes")}</label>
          <textarea
            value={formState.notes}
            onChange={(e) => onUpdateField("notes", e.target.value)}
            rows={2}
            placeholder={t("deliveryNotesPlaceholder")}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
        </div>

        {/* Save address checkbox for authenticated users */}
        {isAuthenticated && !selectedAddressId && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => onSaveAddressChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm">{t("saveAddress")}</span>
          </label>
        )}
      </div>
    </div>
  );
}
