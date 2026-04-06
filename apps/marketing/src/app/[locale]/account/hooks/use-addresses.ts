"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { apiGet } from "@/lib/api-client";
import type { Address, AddressesState } from "../types";

export function useAddresses(): AddressesState {
  const { isAuthenticated, getAccessToken } = useAuth();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const token = getAccessToken();
      const response = await apiGet<{ data: Address[] }>("/api/users/me/addresses", { token: token || undefined });
      return response.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { addresses, isLoading };
}
