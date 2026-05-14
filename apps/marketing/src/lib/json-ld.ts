import { SITE_CONFIG } from "./metadata";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo_capella.webp`,
    contactPoint: {
      "@type": "ContactPoint",
      email: "capellaaae@hotmail.com",
      telephone: "+971524514147",
      contactType: "customer service",
      areaServed: "AE",
      availableLanguage: ["English", "Arabic"],
    },
    sameAs: [],
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
    },
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_CONFIG.url}/en/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface ProductJsonLdOptions {
  product: {
    nameEn: string;
    nameAr: string;
    slug: string;
    descriptionEn: string;
    descriptionAr: string;
    variants: Array<{
      price: number;
      compareAtPrice?: number | null;
      images?: Array<{ url: string }>;
      stock: number;
    }>;
    collections?: Array<{ nameEn: string; nameAr: string; slug: string }>;
  };
  locale: string;
}

export function productJsonLd({ product, locale }: ProductJsonLdOptions) {
  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.nameEn;
  const description = isArabic
    ? product.descriptionAr
    : product.descriptionEn;
  const url = `${SITE_CONFIG.url}/${locale}/products/${product.slug}`;
  const image =
    product.variants?.[0]?.images?.[0]?.url ||
    `${SITE_CONFIG.url}${SITE_CONFIG.defaultImage}`;

  const prices = product.variants
    .filter((v) => v.stock > 0)
    .map((v) => v.price);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const inStock = product.variants.some((v) => v.stock > 0);

  const offers =
    lowPrice === highPrice
      ? {
          "@type": "Offer",
          url,
          priceCurrency: "AED",
          price: lowPrice.toFixed(2),
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: SITE_CONFIG.name },
        }
      : {
          "@type": "AggregateOffer",
          url,
          priceCurrency: "AED",
          lowPrice: lowPrice.toFixed(2),
          highPrice: highPrice.toFixed(2),
          offerCount: prices.length,
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: SITE_CONFIG.name },
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description?.slice(0, 5000) || "",
    url,
    image,
    brand: {
      "@type": "Brand",
      name: SITE_CONFIG.name,
    },
    offers,
  };
}
