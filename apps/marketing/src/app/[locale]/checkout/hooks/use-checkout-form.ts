"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { CheckoutFormState, SavedAddress } from "../types";

export function useCheckoutForm(savedAddresses: SavedAddress[]) {
  const { user } = useAuth();

  const [formState, setFormState] = useState<CheckoutFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    notes: "",
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [hasAutoSelectedAddress, setHasAutoSelectedAddress] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormState((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: (user as any)?.phone || prev.phone,
      }));
    }
  }, [user]);

  // Auto-select first address when addresses are loaded
  useEffect(() => {
    if (savedAddresses.length > 0 && !hasAutoSelectedAddress) {
      const addr = savedAddresses[0];
      setSelectedAddressId(addr.id);
      setFormState((prev) => ({
        ...prev,
        firstName: addr.firstName || user?.firstName || prev.firstName,
        lastName: addr.lastName || user?.lastName || prev.lastName,
        phone: addr.phone || prev.phone,
        address: addr.street || prev.address,
        city: addr.city || prev.city,
        area: addr.state || prev.area,
      }));
      setHasAutoSelectedAddress(true);
    }
  }, [savedAddresses, hasAutoSelectedAddress, user]);

  const updateField = useCallback((field: keyof CheckoutFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectAddress = useCallback((addr: SavedAddress | null) => {
    if (addr) {
      setSelectedAddressId(addr.id);
      setFormState((prev) => ({
        ...prev,
        firstName: addr.firstName || prev.firstName,
        lastName: addr.lastName || prev.lastName,
        phone: addr.phone || prev.phone,
        address: addr.street || "",
        city: addr.city || "",
        area: addr.state || "",
      }));
    } else {
      setSelectedAddressId(null);
      setFormState((prev) => ({
        ...prev,
        address: "",
        city: "",
        area: "",
      }));
    }
  }, []);

  return {
    formState,
    updateField,
    selectedAddressId,
    selectAddress,
    saveAddress,
    setSaveAddress,
  };
}
