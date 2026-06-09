"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Mail, User, Phone } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSignUpForm } from "../hooks";
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

export function SignUpClient({ params }: AuthPageProps) {
  const t = useTranslations("auth.signup");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { formData, state, handlers } = useSignUpForm({ locale: params.locale });

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
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label={t("firstName")}
            type="text"
            value={formData.firstName}
            onChange={(value) => handlers.handleChange("firstName", value)}
            placeholder={t("firstNamePlaceholder")}
            required
            icon={User}
          />
          <FormInput
            label={t("lastName")}
            type="text"
            value={formData.lastName}
            onChange={(value) => handlers.handleChange("lastName", value)}
            placeholder={t("lastNamePlaceholder")}
            required
          />
        </div>

        <FormInput
          label={t("email")}
          type="email"
          value={formData.email}
          onChange={(value) => handlers.handleChange("email", value)}
          placeholder={t("emailPlaceholder")}
          required
          icon={Mail}
        />

        <div>
          <label className="block text-sm font-medium mb-1">{t("phone")} *</label>
          <div className="flex gap-2" dir="ltr">
            <input
              type="tel"
              value="+971"
              readOnly
              className="w-20 px-3 py-3 border rounded-lg bg-gray-50 text-sm font-medium text-muted-foreground"
            />
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (!val.startsWith("5") && val.length > 0) return;
                  if (val.length > 8) return;
                  handlers.handleChange("phone", val);
                }}
                placeholder="5X XXX XXXX"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>

        <PasswordInput
          label={t("password")}
          value={formData.password}
          onChange={(value) => handlers.handleChange("password", value)}
          placeholder={t("passwordPlaceholder")}
          required
          showPassword={state.showPassword}
          onToggleVisibility={handlers.togglePasswordVisibility}
          hint={t("passwordHint")}
        />

        <PasswordInput
          label={t("confirmPassword")}
          value={formData.confirmPassword}
          onChange={(value) => handlers.handleChange("confirmPassword", value)}
          placeholder={t("confirmPasswordPlaceholder")}
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
        question={t("hasAccount")}
        linkText={t("signInLink")}
        linkHref={AUTH_ROUTES.SIGNIN}
        guestText={t("continueAsGuest")}
        guestHref={AUTH_ROUTES.COLLECTIONS}
      />
    </AuthLayout>
  );
}
