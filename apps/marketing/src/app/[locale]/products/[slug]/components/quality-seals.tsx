"use client";

import { Truck, RotateCcw, ShieldCheck, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

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
      <h3 className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">{title}</h3>
      <div className="text-xs md:text-sm font-light text-gray-500 leading-relaxed max-w-[250px]">
        {description}
      </div>
    </div>
  );
}

export function QualitySeals({ locale }: { locale: string }) {
  const t = useTranslations("product");

  const seals = [
    {
      icon: <Truck className="h-6 w-6 stroke-1" />,
      title: t("complimentaryShipping"),
      description: t("complimentaryShippingDesc"),
    },
    {
      icon: <RotateCcw className="h-6 w-6 stroke-1" />,
      title: t("hassleFreeReturns"),
      description: t("hassleFreeReturnsDesc"),
    },
    {
      icon: <ShieldCheck className="h-6 w-6 stroke-1" />,
      title: t("securePayment"),
      description: t("securePaymentDesc"),
    },
    {
      icon: <Mail className="h-6 w-6 stroke-1" />,
      title: t("contactUs"),
      description: (
        <>
          {t("contactUsDesc")}{" "}
          <a href="#" className="underline text-red-700">
            {t("whatsapp")}
          </a>
        </>
      ),
    },
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
