"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { SignInFormData, AuthFormState } from "../types";
import { AUTH_ROUTES } from "../constants";

interface UseSignInFormProps {
  locale: string;
}

export function useSignInForm({ locale }: UseSignInFormProps) {
  const router = useRouter();
  const { signIn } = useAuth();
  const isArabic = locale === "ar";

  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });

  const [state, setState] = useState<AuthFormState>({
    isLoading: false,
    error: "",
    showPassword: false,
  });

  const handleChange = (field: keyof SignInFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = () => {
    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, error: "", isLoading: true }));

    try {
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        router.push(AUTH_ROUTES.HOME);
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || (isArabic ? "فشل تسجيل الدخول" : "Sign in failed"),
          isLoading: false,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        error: isArabic ? "فشل تسجيل الدخول" : "Sign in failed",
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
