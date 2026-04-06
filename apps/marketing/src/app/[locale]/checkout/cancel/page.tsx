import { XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CheckoutCancelPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  const isArabic = locale === "ar";

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <div className="max-w-md w-full mx-auto text-center px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
          {isArabic ? "تم إلغاء الدفع" : "Payment Cancelled"}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {isArabic
            ? "لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى أو المتابعة للتسوق."
            : "Your payment was not completed. You can try again or continue shopping."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            {isArabic ? "العودة إلى السلة" : "Return to Cart"}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {isArabic ? "متابعة التسوق" : "Continue Shopping"}
          </Link>
        </div>
      </div>
    </div>
  );
}
