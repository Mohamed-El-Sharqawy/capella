import { XCircle, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { CancelPageTracker } from "./cancel-tracker";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
}

export default async function CheckoutCancelPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { reason } = await searchParams;
  const t = await getTranslations({ locale, namespace: "checkout" });

  // Distinct outcomes for Tabby cancel vs. reject redirects. Both keep the cart
  // intact (this page never clears it) so the customer can retry or pick
  // another payment method. Approved wording from the Tabby redirect docs.
  const isRejected = reason === "rejected";
  const title = isRejected ? t("cancel.rejectedTitle") : t("cancel.title");
  const message = isRejected ? t("cancel.rejectedMessage") : t("cancel.message");
  const Icon = isRejected ? AlertCircle : XCircle;
  const iconBg = isRejected ? "bg-amber-100" : "bg-red-100";
  const iconColor = isRejected ? "text-amber-600" : "text-red-600";

  return (
    <>
      <CancelPageTracker reason={reason} />
      <div className="min-h-[60vh] flex items-center justify-center py-16 pt-32 md:pt-36">
        <div className="max-w-md w-full mx-auto text-center px-4">
          <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Icon className={`w-10 h-10 ${iconColor}`} />
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
            {title}
          </h1>

          <p className="text-gray-600 mb-6">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              {t("cancel.returnToCheckout")}
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t("cancel.backToCart")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
