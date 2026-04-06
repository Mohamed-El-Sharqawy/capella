import { Link } from "@/i18n/navigation";
import { Facebook, Instagram, Twitter } from "lucide-react";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const isArabic = locale === "ar";

  const shopLinks = [
    { href: "/collections/all-products", label: isArabic ? "تسوق الكل" : "Shop All" },
    { href: "/collections/women", label: isArabic ? "نساء" : "Women" },
    { href: "/collections/men", label: isArabic ? "رجال" : "Men" },
    { href: "/collections", label: isArabic ? "تسوق حسب المجموعة" : "Shop by Collection" },
    { href: "/return-policy", label: isArabic ? "سياسة الإرجاع" : "Return Policy" },
    { href: "/contact", label: isArabic ? "اتصل بنا" : "Contact Us" },
  ];

  const policyLinks = [
    { href: "/privacy-policy", label: isArabic ? "سياسة الخصوصية" : "Privacy Policy" },
    { href: "/refund-policy", label: isArabic ? "سياسة الاسترداد" : "Refund Policy" },
    { href: "/shipping-policy", label: isArabic ? "سياسة الشحن" : "Shipping Policy" },
    { href: "/terms-of-service", label: isArabic ? "شروط الخدمة" : "Terms of Service" },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Contact */}
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {isArabic
                ? "في نهاية اليوم، التحكم ليس معطى. إنه مأخوذ. ومع 909... أنت دائماً مستعد لأخذه."
                : "At the end of the day, control isn't given. It's taken. And with 909... you're always ready to take it back."}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-400"
            >
              {isArabic ? "اتصل بنا" : "Contact us"} →
            </Link>
            <div className="flex gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-gray-700 hover:border-gray-500 transition"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-gray-700 hover:border-gray-500 transition"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-gray-700 hover:border-gray-500 transition"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">
              {isArabic ? "تسوق" : "Shop"}
            </h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">
              {isArabic ? "السياسات" : "Policies"}
            </h3>
            <ul className="space-y-2">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-sm mb-4">
              {isArabic ? "اشترك للبريد الإلكتروني" : "Sign Up for Email"}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {isArabic
                ? "اشترك للحصول على أول إشعار بالوصول الجديد والمبيعات والمحتوى الحصري والأحداث والمزيد!"
                : "Sign up to get first dibs on new arrivals, sales, exclusive content, events and more!"}
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder={isArabic ? "أدخل عنوان البريد الإلكتروني" : "Enter email address"}
                className="flex-1 px-3 py-2 bg-transparent border border-gray-700 rounded text-sm placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition"
              >
                {isArabic ? "اشترك" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 909. {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <div className="flex items-center gap-2">
            <img src="/footer-icons/visa.svg" alt="Visa" className="h-7" />
            <img src="/footer-icons/mastercard.svg" alt="Mastercard" className="h-7" />
            <img src="/footer-icons/fawry.svg" alt="Fawry" className="h-7" />
            <img src="/footer-icons/vodafone.svg" alt="Vodafone Cash" className="h-7" />
            <img src="/footer-icons/apple-pay.svg" alt="Apple Pay" className="h-7" />
          </div>
        </div>
      </div>
    </footer>
  );
}
