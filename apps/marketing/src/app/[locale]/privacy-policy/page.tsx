import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generatePageMetadata, STATIC_PAGE_METADATA } from "@/lib/metadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const content = isArabic ? STATIC_PAGE_METADATA.privacyPolicy.ar : STATIC_PAGE_METADATA.privacyPolicy.en;

  return generatePageMetadata({
    title: content.title,
    description: content.description,
    locale,
    path: "/privacy-policy",
  });
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacyPolicy");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("intro.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("intro.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("collect.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("collect.contact")}</li>
            <li>{t("collect.address")}</li>
            <li>{t("collect.payment")}</li>
            <li>{t("collect.history")}</li>
            <li>{t("collect.preferences")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("use.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("use.process")}</li>
            <li>{t("use.communicate")}</li>
            <li>{t("use.improve")}</li>
            <li>{t("use.marketing")}</li>
            <li>{t("use.security")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("protection.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("protection.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("cookies.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("cookies.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("rights.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("rights.access")}</li>
            <li>{t("rights.correct")}</li>
            <li>{t("rights.delete")}</li>
            <li>{t("rights.optout")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("contactUs.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("contactUs.description")}</p>
        </section>
      </div>
    </div>
  );
}
