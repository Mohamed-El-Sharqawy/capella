import { CheckCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { session_id } = await searchParams;
  const isArabic = locale === "ar";

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <div className="max-w-md w-full mx-auto text-center px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
          {isArabic ? "تم تأكيد طلبك!" : "Order Confirmed!"}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {isArabic
            ? "شكراً لك على طلبك. ستصلك رسالة تأكيد عبر البريد الإلكتروني قريباً."
            : "Thank you for your order. You will receive a confirmation email shortly."}
        </p>

        {session_id && (
          <p className="text-sm text-gray-500 mb-6">
            {isArabic ? "رقم الجلسة: " : "Session ID: "}
            <span className="font-mono">{session_id.slice(0, 20)}...</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            {isArabic ? "متابعة التسوق" : "Continue Shopping"}
          </Link>
        </div>
      </div>
    </div>
  );
}
