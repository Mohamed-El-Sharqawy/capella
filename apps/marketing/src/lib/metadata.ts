import type { Metadata } from "next";

export const SITE_CONFIG = {
  name: "NZN Studio",
  nameAr: "إن زد إن ستوديو",
  domain: "nznstudio.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nznstudio.com",
  defaultImage: "/og-image.jpg",
  twitterHandle: "@nznstudio",
  locale: {
    en: "en_US",
    ar: "ar_EG",
  },
} as const;

export const DEFAULT_METADATA = {
  en: {
    title: "NZN Studio - Premium Fashion & Clothing",
    description:
      "Discover the latest trends in fashion at NZN Studio. Shop premium quality clothing, accessories, and more with fast delivery across Egypt.",
    keywords: [
      "fashion",
      "clothing",
      "Egypt",
      "online shopping",
      "men fashion",
      "women fashion",
      "accessories",
      "NZN Studio",
    ],
  },
  ar: {
    title: "إن زد إن ستوديو - أزياء وملابس فاخرة",
    description:
      "اكتشف أحدث صيحات الموضة في إن زد إن ستوديو. تسوق ملابس عالية الجودة وإكسسوارات والمزيد مع توصيل سريع في جميع أنحاء مصر.",
    keywords: [
      "أزياء",
      "ملابس",
      "مصر",
      "تسوق أونلاين",
      "أزياء رجالية",
      "أزياء نسائية",
      "إكسسوارات",
      "إن زد إن ستوديو",
    ],
  },
} as const;

interface GenerateMetadataOptions {
  title: string;
  description: string;
  locale: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
}

export function generatePageMetadata({
  title,
  description,
  locale,
  path,
  image,
  type = "website",
  noIndex = false,
  keywords = [],
}: GenerateMetadataOptions): Metadata {
  const isArabic = locale === "ar";
  const url = `${SITE_CONFIG.url}/${locale}${path}`;
  const ogImage = image || `${SITE_CONFIG.url}${SITE_CONFIG.defaultImage}`;
  const siteName = isArabic ? SITE_CONFIG.nameAr : SITE_CONFIG.name;
  const defaultKeywords = isArabic
    ? DEFAULT_METADATA.ar.keywords
    : DEFAULT_METADATA.en.keywords;

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_CONFIG.url}/en${path}`,
        ar: `${SITE_CONFIG.url}/ar${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: SITE_CONFIG.locale[locale as keyof typeof SITE_CONFIG.locale] || "en_US",
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
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
  };
}

// Product-specific metadata with structured data support
interface ProductMetadataOptions {
  product: {
    nameEn: string;
    nameAr: string;
    metaTitleEn?: string;
    metaTitleAr?: string;
    metaDescriptionEn?: string;
    metaDescriptionAr?: string;
    shortDescriptionEn?: string;
    shortDescriptionAr?: string;
    slug: string;
    price?: number;
    compareAtPrice?: number;
    variants?: Array<{
      images?: Array<{ url: string }>;
    }>;
  };
  locale: string;
}

export function generateProductMetadata({
  product,
  locale,
}: ProductMetadataOptions): Metadata {
  const isArabic = locale === "ar";
  
  const title = isArabic
    ? product.metaTitleAr || product.nameAr
    : product.metaTitleEn || product.nameEn;
    
  const description = isArabic
    ? product.metaDescriptionAr || product.shortDescriptionAr || `${product.nameAr} - تسوق الآن من إن زد إن ستوديو`
    : product.metaDescriptionEn || product.shortDescriptionEn || `${product.nameEn} - Shop now at NZN Studio`;

  const image = product.variants?.[0]?.images?.[0]?.url;
  const path = `/products/${product.slug}`;

  const keywords = isArabic
    ? [product.nameAr, "شراء", "تسوق", "ملابس"]
    : [product.nameEn, "buy", "shop", "clothing"];

  return generatePageMetadata({
    title,
    description,
    locale,
    path,
    image,
    type: "article",
    keywords,
  });
}

// Collection-specific metadata
interface CollectionMetadataOptions {
  collection: {
    nameEn: string;
    nameAr: string;
    metaTitleEn?: string;
    metaTitleAr?: string;
    metaDescriptionEn?: string;
    metaDescriptionAr?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    slug: string;
    image?: { url: string };
  };
  locale: string;
}

export function generateCollectionMetadata({
  collection,
  locale,
}: CollectionMetadataOptions): Metadata {
  const isArabic = locale === "ar";
  
  const title = isArabic
    ? collection.metaTitleAr || collection.nameAr
    : collection.metaTitleEn || collection.nameEn;
    
  const description = isArabic
    ? collection.metaDescriptionAr || collection.descriptionAr || `تسوق مجموعة ${collection.nameAr} من إن زد إن ستوديو`
    : collection.metaDescriptionEn || collection.descriptionEn || `Shop ${collection.nameEn} collection at NZN Studio`;

  const image = collection.image?.url;
  const path = `/collections/${collection.slug}`;

  const keywords = isArabic
    ? [collection.nameAr, "مجموعة", "تسوق", "أزياء"]
    : [collection.nameEn, "collection", "shop", "fashion"];

  return generatePageMetadata({
    title,
    description,
    locale,
    path,
    image,
    keywords,
  });
}

// Static page metadata configurations
export const STATIC_PAGE_METADATA = {
  home: {
    en: {
      title: "NZN Studio - Premium Fashion & Clothing Store",
      description:
        "Discover the latest fashion trends at NZN Studio. Shop premium quality clothing for men and women with fast delivery across Egypt. New arrivals weekly!",
    },
    ar: {
      title: "إن زد إن ستوديو - متجر أزياء وملابس فاخرة",
      description:
        "اكتشف أحدث صيحات الموضة في إن زد إن ستوديو. تسوق ملابس عالية الجودة للرجال والنساء مع توصيل سريع في جميع أنحاء مصر. وصول جديد أسبوعياً!",
    },
  },
  collections: {
    en: {
      title: "Shop All Collections - NZN Studio",
      description:
        "Browse our curated fashion collections. From casual wear to formal attire, find your perfect style at NZN Studio.",
    },
    ar: {
      title: "تسوق جميع المجموعات - إن زد إن ستوديو",
      description:
        "تصفح مجموعاتنا المختارة من الأزياء. من الملابس الكاجوال إلى الرسمية، اعثر على أسلوبك المثالي في إن زد إن ستوديو.",
    },
  },
  contact: {
    en: {
      title: "Contact Us - NZN Studio Customer Support",
      description:
        "Get in touch with NZN Studio. We're here to help with orders, returns, sizing questions, and more. Fast response guaranteed.",
    },
    ar: {
      title: "تواصل معنا - دعم عملاء إن زد إن ستوديو",
      description:
        "تواصل مع إن زد إن ستوديو. نحن هنا للمساعدة في الطلبات والإرجاع وأسئلة المقاسات والمزيد. استجابة سريعة مضمونة.",
    },
  },
  privacyPolicy: {
    en: {
      title: "Privacy Policy - NZN Studio",
      description:
        "Learn how NZN Studio protects your personal data. Our privacy policy explains data collection, usage, and your rights.",
    },
    ar: {
      title: "سياسة الخصوصية - إن زد إن ستوديو",
      description:
        "تعرف على كيفية حماية إن زد إن ستوديو لبياناتك الشخصية. توضح سياسة الخصوصية لدينا جمع البيانات واستخدامها وحقوقك.",
    },
  },
  termsOfService: {
    en: {
      title: "Terms of Service - NZN Studio",
      description:
        "Read NZN Studio's terms of service. Understand your rights and responsibilities when shopping with us.",
    },
    ar: {
      title: "شروط الخدمة - إن زد إن ستوديو",
      description:
        "اقرأ شروط خدمة إن زد إن ستوديو. افهم حقوقك ومسؤولياتك عند التسوق معنا.",
    },
  },
  refundPolicy: {
    en: {
      title: "Refund Policy - NZN Studio",
      description:
        "NZN Studio refund policy. Learn about our hassle-free refund process, eligibility, and timeline for getting your money back.",
    },
    ar: {
      title: "سياسة الاسترداد - إن زد إن ستوديو",
      description:
        "سياسة استرداد إن زد إن ستوديو. تعرف على عملية الاسترداد السهلة والأهلية والجدول الزمني لاسترداد أموالك.",
    },
  },
  returnPolicy: {
    en: {
      title: "Return Policy - NZN Studio",
      description:
        "Easy returns at NZN Studio. 14-day return window, simple process, and full refund on eligible items. Shop with confidence.",
    },
    ar: {
      title: "سياسة الإرجاع - إن زد إن ستوديو",
      description:
        "إرجاع سهل في إن زد إن ستوديو. فترة إرجاع 14 يومًا، عملية بسيطة، واسترداد كامل للمنتجات المؤهلة. تسوق بثقة.",
    },
  },
  shippingPolicy: {
    en: {
      title: "Shipping Policy - NZN Studio",
      description:
        "Fast shipping across Egypt. Free delivery on orders over 1500 EGP. Track your order and get updates. NZN Studio delivery info.",
    },
    ar: {
      title: "سياسة الشحن - إن زد إن ستوديو",
      description:
        "شحن سريع في جميع أنحاء مصر. توصيل مجاني للطلبات فوق 1500 جنيه. تتبع طلبك واحصل على التحديثات. معلومات توصيل إن زد إن ستوديو.",
    },
  },
} as const;
