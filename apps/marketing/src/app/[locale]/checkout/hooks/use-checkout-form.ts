"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryState, parseAsStringLiteral, parseAsString } from "nuqs";
import { useAuth } from "@/contexts/auth-context";
import type { CheckoutFormState, SavedAddress } from "../types";

const paymentMethods = ["COD", "STRIPE", "TABBY"] as const;

export function useCheckoutForm(savedAddresses: SavedAddress[]) {
  const { user } = useAuth();
  const [paymentQuery, setPaymentQuery] = useQueryState(
    "method",
    parseAsStringLiteral(paymentMethods).withDefault("COD")
  );

  const [formState, setFormState] = useState<CheckoutFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    notes: "",
    paymentMethod: paymentQuery,
  });

  // Sync payment method when query changes or state changes
  const [selectedAddressQuery, setSelectedAddressQuery] = useQueryState("address", parseAsString.withDefault(""));
  const [selectedAddressId, setSelectedAddressIdState] = useState<string | null>(selectedAddressQuery || null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [hasAutoSelectedAddress, setHasAutoSelectedAddress] = useState(false);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  // Helper to sync ID to state and URL
  const setSelectedAddressId = useCallback((id: string | null) => {
    setSelectedAddressIdState(id);
    setSelectedAddressQuery(id || null);
  }, [setSelectedAddressQuery]);

  // Load from local storage ONCE on mount
  useEffect(() => {
    const saved = localStorage.getItem("capella_checkout_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormState((prev) => ({
          ...prev,
          ...parsed,
          paymentMethod: (paymentQuery as any) || parsed.paymentMethod || "COD",
        }));
        
        // If we don't have an address in URL, try to restore it from local storage
        if (!selectedAddressQuery && parsed.selectedAddressId) {
          setSelectedAddressIdState(parsed.selectedAddressId);
        }
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    } else if (paymentQuery) {
      setFormState(prev => ({ ...prev, paymentMethod: paymentQuery as any }));
    }
    setIsLoadedFromStorage(true);
  }, []); // Run only once

  // Save to local storage when form or selection changes
  useEffect(() => {
    if (isLoadedFromStorage) {
      const { paymentMethod, ...dataToSave } = formState;
      localStorage.setItem("capella_checkout_form", JSON.stringify({
        ...dataToSave,
        selectedAddressId,
      }));
      
      // Also sync payment method TO url
      if (paymentMethod !== paymentQuery) {
        setPaymentQuery(paymentMethod as any);
      }
      
      // Sync address selection TO url
      if (selectedAddressId !== selectedAddressQuery) {
        setSelectedAddressQuery(selectedAddressId || null);
      }
    }
  }, [formState, isLoadedFromStorage, paymentQuery, setPaymentQuery, selectedAddressId, selectedAddressQuery, setSelectedAddressQuery]);

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

  // Auto-select first address when addresses are loaded (only if no address is already selected)
  useEffect(() => {
    if (savedAddresses.length > 0 && !hasAutoSelectedAddress && !selectedAddressId) {
      const addr = savedAddresses[0];
      // Use the internal state setter to avoid unnecessary URL updates on mount
      setSelectedAddressIdState(addr.id);
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
    } else if (savedAddresses.length > 0 && !hasAutoSelectedAddress && selectedAddressId) {
      // If we already have a selection (from URL/Storage), just mark as auto-selected to stop this effect
      setHasAutoSelectedAddress(true);
    }
  }, [savedAddresses, hasAutoSelectedAddress, user, selectedAddressId]);

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
  }, [setSelectedAddressId]);

  // Sync form fields when selectedAddressId changes (e.g. from URL restore)
  useEffect(() => {
    if (selectedAddressId && savedAddresses.length > 0) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        setFormState((prev) => ({
          ...prev,
          firstName: addr.firstName || prev.firstName,
          lastName: addr.lastName || prev.lastName,
          phone: addr.phone || prev.phone,
          address: addr.street || prev.address,
          city: addr.city || prev.city,
          area: addr.state || prev.area,
        }));
      }
    }
  }, [selectedAddressId, savedAddresses]);

  return {
    formState,
    updateField,
    selectedAddressId,
    selectAddress,
    saveAddress,
    setSaveAddress,
  };
}
