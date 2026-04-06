"use client";

import { Mail, Phone, Calendar, Edit, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import type { ProfileTabProps } from "../../types";

export function ProfileTab({ locale, phoneEdit }: ProfileTabProps) {
  const t = useTranslations("account.profileTab");
  const { user } = useAuth();
  const isArabic = locale === "ar";
  const { state, handlers } = phoneEdit;

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">
              {isArabic ? "الاسم الأول" : "First Name"}
            </label>
            <p className="font-medium">{user?.firstName || "-"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              {isArabic ? "الاسم الأخير" : "Last Name"}
            </label>
            <p className="font-medium">{user?.lastName || "-"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {t("email")}
            </label>
            <p className="font-medium">{user?.email || "-"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {t("phone")}
            </label>
            {state.isEditing ? (
              <div className="space-y-2 mt-1">
                <input
                  type="tel"
                  value={state.phone}
                  onChange={(e) => handlers.setPhone(e.target.value)}
                  placeholder="+20 1XX XXX XXXX"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
                {state.error && (
                  <p className="text-xs text-red-600">{state.error}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlers.handleSave}
                    disabled={state.isSaving}
                    className="px-3 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {state.isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    {t("save")}
                  </button>
                  <button
                    onClick={handlers.handleCancel}
                    className="px-3 py-1.5 border text-xs rounded hover:bg-gray-100 transition"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium">{(user as any)?.phone || "-"}</p>
                <button
                  onClick={handlers.handleEdit}
                  className="text-muted-foreground hover:text-foreground transition"
                  title={t("edit")}
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">
              {isArabic ? "الدور" : "Role"}
            </label>
            <p className="font-medium capitalize">{user?.role?.toLowerCase() || "customer"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t("createdAt")}
            </label>
            <p className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
