"use client";

import { useLocale, useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui";
import { GIFT_MESSAGE_MAX_LENGTH, type GiftCardState } from "@/lib/gift-card";

interface GiftCardSectionProps {
  value: GiftCardState;
  onChange: (next: GiftCardState) => void;
  /** Set after a blocked submit attempt: the message is required. */
  error?: string | null;
}

export function GiftCardSection({ value, onChange, error }: GiftCardSectionProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Checkbox
        id="checkout-gift-message"
        label={t("addGiftMessage")}
        checked={value.enabled}
        onChange={(checked) => onChange({ ...value, enabled: checked })}
      />

      {value.enabled && (
        <div className="space-y-1 pt-1">
          <textarea
            value={value.message}
            onChange={(e) =>
              onChange({
                enabled: value.enabled,
                message: e.target.value.slice(0, GIFT_MESSAGE_MAX_LENGTH),
              })
            }
            maxLength={GIFT_MESSAGE_MAX_LENGTH}
            rows={3}
            dir={isArabic ? "rtl" : "ltr"}
            placeholder={t("giftMessagePlaceholder")}
            aria-label={t("addGiftMessage")}
            aria-invalid={!!error}
            className="w-full border rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="flex items-center justify-between gap-2">
            {error ? (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
              {t("giftMessageCounter", { count: value.message.length })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
