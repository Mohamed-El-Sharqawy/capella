import type { Metadata } from "next";
import { Inter, Playfair_Display, Cairo, Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { SITE_CONFIG, DEFAULT_METADATA } from "@/lib/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/json-ld";
import "../globals.css";
import { Header, Footer, WhatsAppButton, ScrollToTop } from "@/components/layout";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FacebookPixel, TikTokPixel, PageViewTracker, GtmScript } from "@/components/analytics";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["400", "600", "700"],
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const defaults = isArabic ? DEFAULT_METADATA.ar : DEFAULT_METADATA.en;
  const siteName = isArabic ? SITE_CONFIG.nameAr : SITE_CONFIG.name;

  return {
    title: {
      default: defaults.title,
      template: `%s | ${siteName}`,
    },
    description: defaults.description,
    keywords: [...defaults.keywords],
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    metadataBase: new URL(SITE_CONFIG.url),
    openGraph: {
      type: "website",
      siteName,
      locale: isArabic ? SITE_CONFIG.locale.ar : SITE_CONFIG.locale.en,
      images: [
        {
          url: `${SITE_CONFIG.url}/og-image.webp`,
          width: 1200,
          height: 720,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      images: [`${SITE_CONFIG.url}/og-image.webp`],
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
    // Set GOOGLE_SITE_VERIFICATION / BING_SITE_VERIFICATION to verify
    // ownership in Search Console / Bing Webmaster Tools via meta tag.
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
      ...(process.env.BING_SITE_VERIFICATION
        ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
        : {}),
    },
  };
}

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(locale)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd(locale)) }}
        />
        <FacebookPixel />
        <TikTokPixel />
        <GtmScript />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${cairo.variable} ${montserrat.variable} font-primary`} style={{ '--font-primary': isRtl ? 'var(--font-arabic), sans-serif' : 'var(--font-montserrat), serif' } as React.CSSProperties}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ScrollToTop />
            <Header locale={locale} />
            <main>{children}</main>
            <Footer locale={locale} />
            <CartDrawer locale={locale} />
            <PageViewTracker />
            <WhatsAppButton />
            <Toaster position="top-center" richColors />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
