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
import { Header, Footer, WhatsAppButton } from "@/components/layout";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FacebookPixel, PageViewTracker } from "@/components/analytics";
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
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.webp`,
        width: 1200,
        height: 720,
        alt: SITE_CONFIG.name,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd()) }}
        />
        <FacebookPixel />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${cairo.variable} ${montserrat.variable} font-primary`} style={{ '--font-primary': isRtl ? 'var(--font-arabic), sans-serif' : 'var(--font-montserrat), serif' } as React.CSSProperties}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
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
