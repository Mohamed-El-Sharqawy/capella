"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSignInForm } from "../hooks";
import {
  AuthLayout,
  AuthHeader,
  FormInput,
  PasswordInput,
  SubmitButton,
  ErrorMessage,
  AuthDivider,
  AuthFooter,
} from "../components";
import { AUTH_ROUTES } from "../constants";
import type { AuthPageProps } from "../types";

export function SignInClient({ params }: AuthPageProps) {
  const t = useTranslations("auth.signin");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { formData, state, handlers } = useSignInForm({ locale: params.locale });

  useEffect(() => {
    if (isAuthenticated) {
      router.push(AUTH_ROUTES.HOME);
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <AuthHeader title={t("title")} subtitle={t("subtitle")} />

      <form onSubmit={handlers.handleSubmit} className="space-y-4">
        <FormInput
          label={t("email")}
          type="email"
          value={formData.email}
          onChange={(value) => handlers.handleChange("email", value)}
          placeholder={t("emailPlaceholder")}
          required
          icon={Mail}
        />

        <PasswordInput
          label={t("password")}
          value={formData.password}
          onChange={(value) => handlers.handleChange("password", value)}
          placeholder={t("passwordPlaceholder")}
          required
          showPassword={state.showPassword}
          onToggleVisibility={handlers.togglePasswordVisibility}
        />

        <ErrorMessage message={state.error} />

        <SubmitButton
          isLoading={state.isLoading}
          text={t("submit")}
          loadingText={t("submitting")}
        />
      </form>

      <AuthDivider text={t("or")} />

      <AuthFooter
        question={t("noAccount")}
        linkText={t("signUpLink")}
        linkHref={AUTH_ROUTES.SIGNUP}
        guestText={t("continueAsGuest")}
        guestHref={AUTH_ROUTES.COLLECTIONS}
      />
    </AuthLayout>
  );
}
