import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@ecommerce/shared-utils";
import { SITE_CONFIG } from "./metadata";
import { toPlainText } from "./text";

const ORG_ID = `${SITE_CONFIG.url}/#organization`;
const WEBSITE_ID = `${SITE_CONFIG.url}/#website`;

/** Return window from the published refund & return policy (days). */
const RETURN_DAYS = 5;

/** Store-wide return policy, referenced from the organization and every offer. */
function merchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "AE",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: RETURN_DAYS,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnShippingFees",
    merchantReturnLink: `${SITE_CONFIG.url}/en/refund-return-policy`,
  };
}

/** UAE delivery: flat fee under the free-shipping threshold, 2-5 business days. */
function shippingDetails(price: number) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: price >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST,
      currency: "AED",
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "AE" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 4, unitCode: "DAY" },
    },
  };
}

export function organizationJsonLd(locale = "en") {
  const isArabic = locale === "ar";
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    "@id": ORG_ID,
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.nameAr,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo_capella.webp`,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.defaultImage}`,
    description: isArabic
      ? "كابيلا متجر إماراتي للمجوهرات المصنوعة من الفضة الإسترليني والمطلية بالذهب عيار 18، مع توصيل إلى جميع أنحاء الإمارات."
      : "Capella is a UAE online jewellery store offering sterling silver and 18K gold-plated rings, necklaces, bracelets and earrings, delivered across the UAE.",
    email: "capellaaae@hotmail.com",
    telephone: "+971524514147",
    contactPoint: {
      "@type": "ContactPoint",
      email: "capellaaae@hotmail.com",
      telephone: "+971524514147",
      contactType: "customer service",
      areaServed: "AE",
      availableLanguage: ["English", "Arabic"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    areaServed: { "@type": "Country", name: "United Arab Emirates" },
    currenciesAccepted: "AED",
    paymentAccepted: "Cash on delivery, Credit/debit card (Ziina), Tabby, Tamara",
    hasMerchantReturnPolicy: merchantReturnPolicy(),
    // Official brand profiles: they tie the site to the brand entity for
    // Google's Knowledge Panel and AI assistants.
    sameAs: [
      "https://www.instagram.com/capella.uae/",
      "https://www.facebook.com/people/Capellauae/61589604975656/",
      "https://www.tiktok.com/@capella.uae4",
    ],
  };
}

export function webSiteJsonLd(locale = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.nameAr,
    url: SITE_CONFIG.url,
    inLanguage: ["en", "ar"],
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/${locale}/collections?search={search_term_string}`,
      },
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

interface JsonLdVariant {
  price: number;
  compareAtPrice?: number | null;
  images?: Array<{ url: string }>;
  stock: number;
  isActive?: boolean;
  sku?: string | null;
}

interface ProductJsonLdOptions {
  product: {
    nameEn: string;
    nameAr: string;
    slug: string;
    descriptionEn: string;
    descriptionAr: string;
    shortDescriptionEn?: string | null;
    shortDescriptionAr?: string | null;
    material?: { nameEn: string; nameAr: string } | null;
    variants: JsonLdVariant[];
    collections?: Array<{ nameEn: string; nameAr: string; slug: string }>;
  };
  locale: string;
}

const isBuyable = (v: JsonLdVariant) => v.isActive !== false && v.stock > 0;

export function productJsonLd({ product, locale }: ProductJsonLdOptions) {
  const isArabic = locale === "ar";
  const name = (isArabic ? product.nameAr : product.nameEn).trim();
  // Plain text only: raw HTML in description is ignored or shown verbatim.
  const description = toPlainText(isArabic ? product.descriptionAr : product.descriptionEn);
  const url = `${SITE_CONFIG.url}/${locale}/products/${product.slug}`;

  const images = [
    ...new Set(product.variants.flatMap((v) => v.images?.map((i) => i.url) ?? [])),
  ].slice(0, 6);
  if (images.length === 0) images.push(`${SITE_CONFIG.url}${SITE_CONFIG.defaultImage}`);

  const buyable = product.variants.filter(isBuyable);
  const priced = buyable.length > 0 ? buyable : product.variants;
  const prices = priced.map((v) => v.price);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const availability =
    buyable.length > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  // Offers must carry a priceValidUntil for merchant listings; prices are
  // re-published on every revalidation, so a rolling year is accurate.
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const baseOffer = {
    url,
    priceCurrency: "AED",
    availability,
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": ORG_ID },
    shippingDetails: shippingDetails(lowPrice),
    hasMerchantReturnPolicy: merchantReturnPolicy(),
  };

  const offers =
    lowPrice === highPrice
      ? { "@type": "Offer", ...baseOffer, price: lowPrice.toFixed(2), priceValidUntil }
      : {
          "@type": "AggregateOffer",
          ...baseOffer,
          lowPrice: lowPrice.toFixed(2),
          highPrice: highPrice.toFixed(2),
          offerCount: priced.length,
        };

  const material = isArabic ? product.material?.nameAr : product.material?.nameEn;
  // Product type ("Rings") rather than the design line ("Oria Collection").
  const category =
    product.collections?.find((c) => !c.slug.endsWith("-collection")) ?? product.collections?.[0];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description.slice(0, 5000),
    url,
    image: images,
    sku: product.variants[0]?.sku || undefined,
    brand: { "@type": "Brand", name: SITE_CONFIG.name },
    ...(material ? { material } : {}),
    ...(category ? { category: isArabic ? category.nameAr : category.nameEn } : {}),
    offers,
  };
}

interface CollectionJsonLdOptions {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  products: Array<{ slug: string; nameEn: string; nameAr: string }>;
}

/** CollectionPage + ItemList: tells Google/AI which products a category holds. */
export function collectionJsonLd({ name, description, url, locale, products }: CollectionJsonLdOptions) {
  const isArabic = locale === "ar";
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(description ? { description: toPlainText(description) } : {}),
    url,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_CONFIG.url}/${locale}/products/${p.slug}`,
        name: (isArabic ? p.nameAr : p.nameEn).trim(),
      })),
    },
  };
}
