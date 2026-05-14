import { XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { CancelPageTracker } from "./cancel-tracker";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CheckoutCancelPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });

  return (
    <>
    <CancelPageTracker />
    <div className="min-h-[60vh] flex items-center justify-center py-16 pt-32 md:pt-36">
      <div className="max-w-md w-full mx-auto text-center px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
          {t("cancel.title")}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {t("cancel.message")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            {t("cancel.backToCart")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
