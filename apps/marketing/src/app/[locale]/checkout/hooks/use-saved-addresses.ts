"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { apiGet, apiPost } from "@/lib/api-client";
import type { SavedAddress } from "../types";
import { DEFAULT_COUNTRY, DEFAULT_ZIP_CODE } from "../constants";

export function useSavedAddresses() {
  const { isAuthenticated, getAccessToken } = useAuth();

  const { data: addressesData, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ["addresses", isAuthenticated],
    queryFn: async () => {
      const token = getAccessToken();
      const response = await apiGet<{ data: SavedAddress[] }>("/api/users/me/addresses", {
        token: token || undefined,
      });
      return response.data || [];
    },
    enabled: isAuthenticated,
  });

  const savedAddresses = addressesData || [];

  const saveNewAddress = async (addressData: {
    firstName: string;
    lastName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
  }) => {
    if (!isAuthenticated) return;

    try {
      const token = getAccessToken();
      await apiPost(
        "/api/users/me/addresses",
        {
          ...addressData,
          zipCode: DEFAULT_ZIP_CODE,
          country: DEFAULT_COUNTRY,
          isDefault: savedAddresses.length === 0,
        },
        { token: token || undefined }
      );
    } catch {
      console.error("Failed to save address");
    }
  };

  return {
    savedAddresses,
    isLoadingAddresses,
    saveNewAddress,
  };
}
