"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiPatch } from "@/lib/api-client";
import type { PhoneEditState, PhoneEditHandlers } from "../types";

interface UsePhoneEditOptions {
  isArabic: boolean;
}

export function usePhoneEdit({ isArabic }: UsePhoneEditOptions): { state: PhoneEditState; handlers: PhoneEditHandlers } {
  const { user, getAccessToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleEdit = useCallback(() => {
    setPhone((user as any)?.phone || "");
    setError("");
    setIsEditing(true);
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!phone.trim()) {
      setError(isArabic ? "رقم الهاتف مطلوب" : "Phone number is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const token = getAccessToken();
      await apiPatch("/api/users/me", { phone }, { token: token || undefined });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isArabic ? "فشل تحديث رقم الهاتف" : "Failed to update phone"));
    } finally {
      setIsSaving(false);
    }
  }, [phone, isArabic, getAccessToken]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setPhone("");
    setError("");
  }, []);

  return {
    state: { isEditing, phone, isSaving, error },
    handlers: { handleEdit, handleSave, handleCancel, setPhone },
  };
}
