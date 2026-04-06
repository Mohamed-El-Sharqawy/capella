"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import type { ContactInfoItem, SubjectOption, FaqItem } from "../types";

export function useContactData() {
  const t = useTranslations("contact");

  const contactInfo: ContactInfoItem[] = useMemo(
    () => [
      {
        icon: Phone,
        title: t("info.phone"),
        value: t("info.phoneValue"),
        href: "tel:+201234567890",
      },
      {
        icon: Mail,
        title: t("info.email"),
        value: t("info.emailValue"),
        href: `mailto:${t("info.emailValue")}`,
      },
      {
        icon: MapPin,
        title: t("info.address"),
        value: t("info.addressValue"),
        href: null,
      },
      {
        icon: Clock,
        title: t("info.hours"),
        value: t("info.hoursValue"),
        href: null,
      },
    ],
    [t]
  );

  const subjects: SubjectOption[] = useMemo(
    () => [
      { value: "", label: t("form.subjectPlaceholder") },
      { value: "general", label: t("form.subjects.general") },
      { value: "order", label: t("form.subjects.order") },
      { value: "return", label: t("form.subjects.return") },
      { value: "product", label: t("form.subjects.product") },
      { value: "other", label: t("form.subjects.other") },
    ],
    [t]
  );

  const faqs: FaqItem[] = useMemo(
    () => [
      { q: t("faq.delivery.q"), a: t("faq.delivery.a") },
      { q: t("faq.returns.q"), a: t("faq.returns.a") },
      { q: t("faq.payment.q"), a: t("faq.payment.a") },
      { q: t("faq.tracking.q"), a: t("faq.tracking.a") },
    ],
    [t]
  );

  return {
    contactInfo,
    subjects,
    faqs,
  };
}
