import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { SITE_CONFIG, DEFAULT_METADATA } from "@/lib/metadata";
import "../globals.css";
import { Header, Footer } from "@/components/layout";
import { InfiniteMarquee } from "@/components/ui";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FacebookPixel } from "@/components/analytics";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: DEFAULT_METADATA.en.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: DEFAULT_METADATA.en.description,
  keywords: [...DEFAULT_METADATA.en.keywords],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: "your-google-verification-code",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = locale === "ar";

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"}>
      <head>
        <FacebookPixel />
      </head>
      <body className={`${inter.className}`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <InfiniteMarquee
              text={
                locale === "ar"
                  ? "تخفيضات نهاية الموسم"
                  : "END OF SEASON SALE"
              }
              className="bg-red-600 py-2"
              textClassName="text-xs font-semibold text-white uppercase tracking-wider"
              separator="—"
              speed="normal"
              isArabic={locale === "ar"}
            />
            <Header />
            <main>{children}</main>
            <Footer locale={locale} />
            <CartDrawer locale={locale} />
            <Toaster position="top-center" richColors />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
