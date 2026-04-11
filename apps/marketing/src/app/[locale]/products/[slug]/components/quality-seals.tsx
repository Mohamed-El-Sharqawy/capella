import { Truck, RotateCcw, ShieldCheck, Mail } from "lucide-react";

interface SealProps {
  icon: React.ReactNode;
  title: string;
  description: string | React.ReactNode;
}

function Seal({ icon, title, description }: SealProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-3 px-4">
      <div className="text-gray-900 border border-gray-100 p-3 rounded-full bg-gray-50 mb-2">
        {icon}
      </div>
      <h3 className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.2em]">{title}</h3>
      <div className="text-[10px] md:text-xs font-light text-gray-500 leading-relaxed max-w-[250px]">
        {description}
      </div>
    </div>
  );
}

export function QualitySeals({ locale }: { locale: string }) {
  const isArabic = locale === "ar";

  const seals = [
    {
      icon: <Truck className="h-6 w-6 stroke-1" />,
      title: isArabic ? "شحن مجاني" : "Complimentary Shipping",
      description: isArabic 
        ? "شحن مجاني في جميع أنحاء العالم - يشمل الرسوم والضرائب التقديرية" 
        : "Free worldwide shipping - estimated customs and duties taxes included"
    },
    {
      icon: <RotateCcw className="h-6 w-6 stroke-1" />,
      title: isArabic ? "إرجاع سهل وبدون مشاكل" : "Hassle Free Returns",
      description: isArabic
        ? "نحن متواجدون من الاثنين إلى الجمعة للإجابة على جميع تساؤلاتكم"
        : <>We are available from Monday to Friday to answer your questions</>
    },
    {
      icon: <ShieldCheck className="h-6 w-6 stroke-1" />,
      title: isArabic ? "دفع آمن" : "Secure Payment",
      description: isArabic
        ? "يتم معالجة معلومات الدفع الخاصة بك بشكل آمن"
        : "Your payment information is processed securely"
    },
    {
      icon: <Mail className="h-6 w-6 stroke-1" />,
      title: isArabic ? "اتصل بنا" : "Contact us",
      description: isArabic
        ? <>هل تحتاج إلى المساعدة؟ أرسل بريدًا إلكترونيًا أو عبر <a href="#" className="underline text-red-700">الواتساب</a></>
        : <>Need to contact us? Just send us an email or via <a href="#" className="underline text-red-700">WhatsApp</a></>
    }
  ];

  return (
    <div className="bg-white py-16 border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {seals.map((seal, idx) => (
            <Seal key={idx} {...seal} />
          ))}
        </div>
      </div>
    </div>
  );
}
