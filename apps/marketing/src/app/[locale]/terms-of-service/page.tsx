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
  const content = isArabic ? STATIC_PAGE_METADATA.termsOfService.ar : STATIC_PAGE_METADATA.termsOfService.en;

  return generatePageMetadata({
    title: content.title,
    description: content.description,
    locale,
    path: "/terms-of-service",
  });
}

export default async function TermsOfServicePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("termsOfService");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("intro.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("intro.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("usage.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("usage.age")}</li>
            <li>{t("usage.account")}</li>
            <li>{t("usage.accurate")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("orders.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("orders.prices")}</li>
            <li>{t("orders.refuse")}</li>
            <li>{t("orders.stock")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("ip.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("ip.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("liability.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("liability.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("prohibited.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("prohibited.illegal")}</li>
            <li>{t("prohibited.unauthorized")}</li>
            <li>{t("prohibited.harmful")}</li>
            <li>{t("prohibited.violate")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("modifications.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("modifications.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("law.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("law.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("contactUs.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("contactUs.description")}</p>
        </section>
      </div>
    </div>
  );
}
