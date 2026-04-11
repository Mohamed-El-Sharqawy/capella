import { Link } from "@/i18n/navigation";
import { Facebook, Instagram, Twitter } from "lucide-react";
import Image from "next/image";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const isArabic = locale === "ar";

  const shopLinks = [
    { href: "/about", label: isArabic ? "عن كابيلا" : "About Us" },
    { href: "/collections/all-products", label: isArabic ? "تسوق الكل" : "Shop All" },
    { href: "/collections", label: isArabic ? "تسوق حسب المجموعة" : "Shop by Collection" },
    { href: "/contact", label: isArabic ? "اتصل بنا" : "Contact Us" },
  ];

  const policyLinks = [
    { href: "/privacy-policy", label: isArabic ? "سياسة الخصوصية" : "Privacy Policy" },
    { href: "/refund-policy", label: isArabic ? "سياسة الاسترداد" : "Refund Policy" },
    { href: "/return-policy", label: isArabic ? "سياسة الإرجاع" : "Return Policy" },
    { href: "/shipping-policy", label: isArabic ? "سياسة الشحن" : "Shipping Policy" },
    { href: "/terms-of-service", label: isArabic ? "شروط الخدمة" : "Terms of Service" },
  ];

  return (
    <footer className="bg-black text-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand & Newsletter */}
          <div className="md:col-span-2 space-y-8">
            <Link href="/" className="text-2xl font-light uppercase tracking-[0.3em]">
              <Image src="/logo_capella.webp" alt="Logo" width={200} height={200} />
            </Link>
            <div className="max-w-md space-y-4">
              <h3 className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                {isArabic ? "اشترك للحصول على التحديثات" : "Subscribe for Updates"}
              </h3>
              <form className="relative">
                <input
                  type="email"
                  placeholder={isArabic ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                  className="w-full bg-transparent border-b border-gray-800 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest hover:opacity-60 transition-opacity"
                >
                  {isArabic ? "إرسال" : "Submit"}
                </button>
              </form>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:opacity-60 transition-opacity"><Instagram className="h-4 w-4" strokeWidth={1.5} /></a>
              <a href="#" className="hover:opacity-60 transition-opacity"><Facebook className="h-4 w-4" strokeWidth={1.5} /></a>
              <a href="#" className="hover:opacity-60 transition-opacity"><Twitter className="h-4 w-4" strokeWidth={1.5} /></a>
            </div>
          </div>

          {/* Shop Links */}
          <div className="space-y-6">
            <h3 className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              {isArabic ? "تسوق" : "Shop"}
            </h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[11px] md:text-xs uppercase tracking-widest hover:text-gray-400 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div className="space-y-6">
            <h3 className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              {isArabic ? "السياسات" : "Policies"}
            </h3>
            <ul className="space-y-3">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[11px] md:text-xs uppercase tracking-widest hover:text-gray-400 transition"
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
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            © 2026 capella. {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}
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
