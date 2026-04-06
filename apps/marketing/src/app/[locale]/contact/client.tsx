"use client";

import { useTranslations } from "next-intl";
import { useContactForm, useContactData } from "./hooks";
import { ContactInfoCard, LocationMap, ContactForm, FaqSection } from "./components";
import type { ContactPageClientProps } from "./types";

export function ContactPageClient({ locale }: ContactPageClientProps) {
  const t = useTranslations("contact");

  const { contactInfo, subjects, faqs } = useContactData();
  const { formData, isSubmitting, submitStatus, handleChange, handleSubmit, resetStatus } =
    useContactForm();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <ContactInfoCard contactInfo={contactInfo} />
            <LocationMap />
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6">{t("sendMessage")}</h2>
              <ContactForm
                formData={formData}
                isSubmitting={isSubmitting}
                submitStatus={submitStatus}
                subjects={subjects}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onReset={resetStatus}
              />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <FaqSection faqs={faqs} />
      </div>
    </div>
  );
}
