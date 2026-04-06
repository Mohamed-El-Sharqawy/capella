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
    <section className="py-12 border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <feature.icon className="h-6 w-6 mb-3" strokeWidth={1.5} />
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
