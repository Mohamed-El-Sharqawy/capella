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
  const content = isArabic ? STATIC_PAGE_METADATA.refundReturnPolicy.ar : STATIC_PAGE_METADATA.refundReturnPolicy.en;

  return generatePageMetadata({
    title: content.title,
    description: content.description,
    locale,
    path: "/refund-return-policy",
  });
}

export default async function RefundReturnPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("refundReturnPolicy");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-32 md:pt-36">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("overview.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("overview.description")}</p>
        </section>

        {/* Return Period */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("returnPeriod.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("returnPeriod.description")}</p>
        </section>

        {/* Return Conditions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("returnConditions.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("returnConditions.unused")}</li>
            <li>{t("returnConditions.tags")}</li>
            <li>{t("returnConditions.receipt")}</li>
            <li>{t("returnConditions.packaging")}</li>
          </ul>
        </section>

        {/* Non-Returnable Items */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("nonReturnable.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("nonReturnable.underwear")}</li>
            <li>{t("nonReturnable.custom")}</li>
            <li>{t("nonReturnable.sale")}</li>
          </ul>
        </section>

        {/* How to Return */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("howToReturn.title")}</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>{t("howToReturn.contact")}</li>
            <li>{t("howToReturn.authorization")}</li>
            <li>{t("howToReturn.pack")}</li>
            <li>{t("howToReturn.ship")}</li>
          </ol>
        </section>

        {/* Refund Eligibility */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("refundEligibility.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("refundEligibility.time")}</li>
            <li>{t("refundEligibility.condition")}</li>
            <li>{t("refundEligibility.proof")}</li>
          </ul>
        </section>

        {/* Refund Methods */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("refundMethods.title")}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>{t("refundMethods.original")}</li>
            <li>{t("refundMethods.credit")}</li>
          </ul>
        </section>

        {/* Refund Timeline */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("refundTimeline.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("refundTimeline.description")}</p>
        </section>

        {/* Contact Us */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("contactUs.title")}</h2>
          <p className="text-gray-600 leading-relaxed">{t("contactUs.description")}</p>
        </section>
      </div>
    </div>
  );
}
