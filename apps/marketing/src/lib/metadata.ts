import type { Metadata } from "next";

export const SITE_CONFIG = {
  name: "Capella",
  nameAr: "كابيلا",
  domain: "capellaae.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://capellaae.com",
  defaultImage: "/og-image.webp",
  twitterHandle: "@capellaae",
  locale: {
    en: "en_US",
    ar: "ar_AE",
  },
} as const;

export const DEFAULT_METADATA = {
  en: {
    title: "Capella - Premium Silver & Gold-Plated Jewellery",
    description:
      "Discover handcrafted silver and gold-plated jewellery at Capella. Shop rings, necklaces, bracelets, and earrings with fast delivery across UAE.",
    keywords: [
      "jewellery",
      "silver jewellery",
      "gold-plated jewellery",
      "UAE",
      "Dubai",
      "Abu Dhabi",
      "online shopping",
      "rings",
      "necklaces",
      "bracelets",
      "earrings",
      "Capella",
    ],
  },
  ar: {
    title: "كابيلا - مجوهرات فضة ومطلية بالذهب فاخرة",
    description:
      "اكتشف مجوهرات الفضة والمطلية بالذهب المصنوعة يدوياً في كابيلا. تسوق الخواتم والقلائد والأساور والأقراط مع توصيل سريع في جميع أنحاء الإمارات.",
    keywords: [
      "مجوهرات",
      "فضة",
      "مجوهرات مطلية بالذهب",
      "الإمارات",
      "دبي",
      "أبو ظبي",
      "تسوق أونلاين",
      "خواتم",
      "قلائد",
      "أساور",
      "أقراط",
      "كابيلا",
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
    ? product.metaDescriptionAr || product.shortDescriptionAr || `${product.nameAr} - تسوق الآن من كابيلا`
    : product.metaDescriptionEn || product.shortDescriptionEn || `${product.nameEn} - Shop now at Capella`;

  const image = product.variants?.[0]?.images?.[0]?.url;
  const path = `/products/${product.slug}`;

  const keywords = isArabic
    ? [product.nameAr, "شراء", "تسوق", "مجوهرات"]
    : [product.nameEn, "buy", "shop", "jewellery"];

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
    ? collection.metaDescriptionAr || collection.descriptionAr || `تسوق مجموعة ${collection.nameAr} من كابيلا`
    : collection.metaDescriptionEn || collection.descriptionEn || `Shop ${collection.nameEn} collection at Capella`;

  const image = collection.image?.url;
  const path = `/collections/${collection.slug}`;

  const keywords = isArabic
    ? [collection.nameAr, "مجموعة", "تسوق", "مجوهرات"]
    : [collection.nameEn, "collection", "shop", "jewellery"];

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
      title: "Capella - Premium Silver & Gold-Plated Jewellery Store",
      description:
        "Discover handcrafted silver and gold-plated jewellery at Capella. Shop rings, necklaces, bracelets, and earrings with fast delivery across UAE. New arrivals weekly!",
    },
    ar: {
      title: "كابيلا - متجر مجوهرات فضة ومطلية بالذهب فاخرة",
      description:
        "اكتشف مجوهرات الفضة والمطلية بالذهب المصنوعة يدوياً في كابيلا. تسوق الخواتم والقلائد والأساور والأقراط مع توصيل سريع في جميع أنحاء الإمارات. وصول جديد أسبوعياً!",
    },
  },
  collections: {
    en: {
      title: "Shop All Collections - Capella",
      description:
        "Browse our curated jewellery collections. From everyday elegance to statement pieces, find your perfect style at Capella.",
    },
    ar: {
      title: "تسوق جميع المجموعات - كابيلا",
      description:
        "تصفح مجموعاتنا المختارة من المجوهرات. من الأناقة اليومية إلى القطعات المميزة، اعثر على أسلوبك المثالي في كابيلا.",
    },
  },
  contact: {
    en: {
      title: "Contact Us - Capella Customer Support",
      description:
        "Get in touch with Capella. We're here to help with orders, returns, jewellery care, and more. Fast response guaranteed.",
    },
    ar: {
      title: "تواصل معنا - دعم عملاء كابيلا",
      description:
        "تواصل مع كابيلا. نحن هنا للمساعدة في الطلبات والإرجاع والعناية بالمجوهرات والمزيد. استجابة سريعة مضمونة.",
    },
  },
  privacyPolicy: {
    en: {
      title: "Privacy Policy - Capella",
      description:
        "Learn how Capella protects your personal data. Our privacy policy explains data collection, usage, and your rights.",
    },
    ar: {
      title: "سياسة الخصوصية - كابيلا",
      description:
        "تعرف على كيفية حماية كابيلا لبياناتك الشخصية. توضح سياسة الخصوصية لدينا جمع البيانات واستخدامها وحقوقك.",
    },
  },
  termsOfService: {
    en: {
      title: "Terms of Service - Capella",
      description:
        "Read Capella's terms of service. Understand your rights and responsibilities when shopping with us.",
    },
    ar: {
      title: "شروط الخدمة - كابيلا",
      description:
        "اقرأ شروط خدمة كابيلا. افهم حقوقك ومسؤولياتك عند التسوق معنا.",
    },
  },
  refundReturnPolicy: {
    en: {
      title: "Refund & Return Policy - Capella",
      description:
        "Capella refund and return policy. Easy returns, hassle-free refunds, and clear eligibility guidelines. Shop with confidence.",
    },
    ar: {
      title: "سياسة الاسترداد والإرجاع - كابيلا",
      description:
        "سياسة الاسترداد والإرجاع في كابيلا. إرجاع سهل، استرداد بدون متاعب، وإرشادات أهلية واضحة. تسوق بثقة.",
    },
  },
  shippingPolicy: {
    en: {
      title: "Shipping Policy - Capella",
      description:
        "Fast shipping across UAE. Free delivery on orders over 500 AED. Track your order and get updates. Capella delivery info.",
    },
    ar: {
      title: "سياسة الشحن - كابيلا",
      description:
        "شحن سريع في جميع أنحاء الإمارات. توصيل مجاني للطلبات فوق 500 درهم. تتبع طلبك واحصل على التحديثات. معلومات توصيل كابيلا.",
    },
  },
} as const;
