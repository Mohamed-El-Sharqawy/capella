"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { SignUpFormData, AuthFormState } from "../types";
import { AUTH_ROUTES, MIN_PASSWORD_LENGTH } from "../constants";

interface UseSignUpFormProps {
  locale: string;
}

export function useSignUpForm({ locale }: UseSignUpFormProps) {
  const router = useRouter();
  const { signUp } = useAuth();
  const isArabic = locale === "ar";

  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [state, setState] = useState<AuthFormState>({
    isLoading: false,
    error: "",
    showPassword: false,
  });

  const handleChange = (field: keyof SignUpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = () => {
    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  };

  const validateForm = (): string | null => {
    if (formData.password !== formData.confirmPassword) {
      return isArabic ? "كلمات المرور غير متطابقة" : "Passwords do not match";
    }

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      return isArabic
        ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
        : "Password must be at least 6 characters";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, error: "" }));

    const validationError = validateForm();
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      if (result.success) {
        router.push(AUTH_ROUTES.HOME);
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || (isArabic ? "فشل إنشاء الحساب" : "Sign up failed"),
          isLoading: false,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        error: isArabic ? "فشل إنشاء الحساب" : "Sign up failed",
        isLoading: false,
      }));
    }
  };

  return {
    formData,
    state,
    handlers: {
      handleChange,
      togglePasswordVisibility,
      handleSubmit,
    },
  };
}
