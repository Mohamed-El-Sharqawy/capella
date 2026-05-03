import { CreditCard, RotateCcw, Headphones } from "lucide-react";

interface FeaturesProps {
  locale: string;
}

export function Features({ locale }: FeaturesProps) {
  const isArabic = locale === "ar";

  const features = [
    {
      icon: CreditCard,
      title: isArabic ? "دفع مرن" : "Flexible Payment",
      description: isArabic
        ? "ادفع ببطاقات ائتمان متعددة"
        : "Pay with Multiple Credit Cards",
    },
    {
      icon: RotateCcw,
      title: isArabic ? "إرجاع سهل وسريع" : "Fast and Easy Returns",
      description: isArabic
        ? "خلال يومين للاستبدال"
        : "Within 2 days for an exchange",
    },
    {
      icon: Headphones,
      title: isArabic ? "دعم متميز" : "Premium Support",
      description: isArabic
        ? "دعم متميز متواصل"
        : "Outstanding premium support",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-black/5 bg-white shadow-sm">
                <feature.icon className="h-5 w-5 text-black" strokeWidth={1} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm md:text-base font-medium uppercase tracking-[0.2em]">{feature.title}</h3>
                <p className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground font-light italic">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
}
