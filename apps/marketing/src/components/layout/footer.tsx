import { Link } from "@/i18n/navigation";
import { SocialShare } from "@/components/ui";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const isArabic = locale === "ar";
  const t = useTranslations("footer");

  const shopLinks = [
    { href: "/about", label: t("aboutUs") },
    { href: "/collections/all-products", label: t("shopAll") },
    { href: "/collections", label: t("shopByCollection") },
    { href: "/contact", label: t("contactUs") },
  ];

  const policyLinks = [
    { href: "/privacy-policy", label: t("privacyPolicy") },
    { href: "/refund-return-policy", label: t("refundReturnPolicy") },
    { href: "/shipping-policy", label: t("shippingPolicy") },
    { href: "/terms-of-service", label: t("termsOfService") },
  ];

  return (
    <footer className="bg-black text-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand & Newsletter */}
          <div className="md:col-span-2 space-y-8">
            <Link href="/" className="text-2xl font-light uppercase tracking-[0.3em]">
              <Image src="/logo_capella_light.webp" alt="Logo" width={200} height={200} />
            </Link>
            <div className="max-w-md space-y-4">
              <h3 className="text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
                {t("subscribeForUpdates")}
              </h3>
              <form className="relative">
                <input
                  type="email"
                  placeholder={t("enterEmail")}
                  className="w-full bg-transparent border-b border-gray-800 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  className="absolute top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest px-3 py-1.5 border border-white/20 hover:bg-white hover:text-black transition-all cursor-pointer"
                  style={{
                    left: isArabic ? 0 : undefined,
                    right: isArabic ? undefined : 0
                  }}
                >
                  {t("submit")}
                </button>
              </form>
            </div>
            <SocialShare variant="footer" />
          </div>

          {/* Shop Links */}
          <div className="space-y-6">
            <h3 className="text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
              {t("shop")}
            </h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs md:text-sm uppercase tracking-widest hover:text-gray-400 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div className="space-y-6">
            <h3 className="text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
              {t("policies")}
            </h3>
            <ul className="space-y-3">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs md:text-sm uppercase tracking-widest hover:text-gray-400 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            © 2026 capella. {t("allRightsReserved")}
          </p>
          <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <img src="/footer-icons/visa.svg" alt="Visa" className="h-5" />
            <img src="/footer-icons/mastercard.svg" alt="Mastercard" className="h-5" />
            <img src="/footer-icons/apple-pay.svg" alt="Apple Pay" className="h-5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
