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
  const content = isArabic ? STATIC_PAGE_METADATA.refundPolicy.ar : STATIC_PAGE_METADATA.refundPolicy.en;

  return generatePageMetadata({
    title: content.title,
    description: content.description,
    locale,
    path: "/refund-policy",
  });
}

export default async function RefundPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("refundPolicy");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("overview.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("overview.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("eligibility.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("eligibility.time")}</li>
            <li>{t("eligibility.condition")}</li>
            <li>{t("eligibility.proof")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("process.title")}</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>{t("process.submit")}</li>
            <li>{t("process.wait")}</li>
            <li>{t("process.return")}</li>
            <li>{t("process.receive")}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("timeline.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("timeline.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("methods.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("methods.original")}</li>
            <li>{t("methods.credit")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("exceptions.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("exceptions.description")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t("contactUs.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("contactUs.description")}</p>
        </section>
      </div>
    </div>
  );
}
