/**
 * llms.txt generator (https://llmstxt.org): a Markdown summary of the store
 * for AI assistants. Facts here mirror the published policy pages; keep them
 * in sync when a policy changes. Product/collection data is live.
 */
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@ecommerce/shared-utils";
import { SITE_CONFIG } from "./metadata";
import {
  getSeoCollections,
  getSeoProducts,
  localeUrl,
  type SeoCollection,
  type SeoLocale,
  type SeoProduct,
} from "./seo-data";
import { toPlainText } from "./text";

const PHONE = "+971 52 451 4147";
const EMAIL = "capellaaae@hotmail.com";

/** Design collections ("amour-collection") vs. product categories ("rings"). */
const isDesignCollection = (c: { slug: string }) => c.slug.endsWith("-collection");

const COPY = {
  en: {
    title: "Capella",
    summary:
      "Capella (Arabic: كابيلا) is a UAE-based online jewellery brand selling sterling silver and 18K gold-plated rings, necklaces, bracelets and earrings, with delivery across the United Arab Emirates. Prices are in UAE dirhams (AED).",
    intro:
      "Capella's designs are inspired by stars and the cosmos. Collections are sold in sterling silver and in 18K yellow gold plating, and each order arrives in Capella's signature gift box with an authenticity card. The website is available in English and Arabic.",
    factsTitle: "Key facts",
    facts: [
      "Market: United Arab Emirates (all emirates). For international orders, customers contact customer service.",
      `Currency: AED. Shipping: AED ${SHIPPING_COST}, free on orders of AED ${FREE_SHIPPING_THRESHOLD} or more.`,
      "Delivery time: 2-5 business days within the UAE. Customers receive a tracking number by SMS or email once shipped.",
      "Payment: cash on delivery, debit/credit card (via Ziina), and pay-in-instalments with Tabby or Tamara.",
      "Returns & exchanges: within 5 days of delivery for unworn, unused, undamaged items in original Capella packaging. Original shipping and bank fees are not refunded; a fixed shipping fee is deducted from refunds. Approved refunds are processed in 5-10 business days to the original payment method.",
      "Materials: 925 sterling silver and 18K yellow gold plating; many pieces are set with cubic zirconia. Product pages state the material of each piece.",
      `Customer service: phone/WhatsApp ${PHONE}, email ${EMAIL}. Based in Dubai, UAE. Hours: Monday-Saturday, 10 AM-10 PM (UAE time).`,
    ],
    categories: "Shop by category",
    collections: "Collections",
    allProducts: "All jewellery",
    allProductsDesc: "Every Capella piece in one list",
    products: "Products",
    inStock: "in stock",
    soldOut: "currently sold out",
    from: "from",
    policies: "Customer service & policies",
    pages: {
      shipping: ["Shipping policy", "UAE delivery areas, times, tracking and cash on delivery"],
      returns: ["Refund & return policy", "5-day returns, conditions and refund timeline"],
      contact: ["Contact", "Phone, WhatsApp, email, hours and FAQ"],
      about: ["About Capella", "The brand story and design philosophy"],
    },
    optional: "Optional",
    legal: {
      privacy: ["Privacy policy", "How customer data is collected and used"],
      terms: ["Terms of service", "Conditions of sale"],
    },
    other: "Other languages",
    otherLink: ["Arabic version (النسخة العربية)", "This file in Arabic"],
  },
  ar: {
    title: "كابيلا (Capella)",
    summary:
      "كابيلا علامة مجوهرات إماراتية تبيع عبر الإنترنت خواتم وقلائد وأساور وأقراطاً من الفضة الإسترليني والمطلية بالذهب عيار 18، مع التوصيل إلى جميع أنحاء دولة الإمارات العربية المتحدة. الأسعار بالدرهم الإماراتي.",
    intro:
      "تستلهم تصاميم كابيلا من النجوم والفضاء. تتوفر المجموعات بالفضة الإسترليني وبطلاء الذهب الأصفر عيار 18، ويصل كل طلب في علبة هدايا كابيلا المميزة مع بطاقة أصالة. الموقع متاح باللغتين العربية والإنجليزية.",
    factsTitle: "معلومات أساسية",
    facts: [
      "السوق: الإمارات العربية المتحدة (جميع الإمارات). للطلبات الدولية يُرجى التواصل مع خدمة العملاء.",
      `العملة: الدرهم الإماراتي. الشحن: ${SHIPPING_COST} درهماً، ومجاني للطلبات بقيمة ${FREE_SHIPPING_THRESHOLD} درهم أو أكثر.`,
      "مدة التوصيل: من 2 إلى 5 أيام عمل داخل الإمارات، مع رقم تتبع يُرسل عبر رسالة نصية أو بريد إلكتروني بعد الشحن.",
      "طرق الدفع: الدفع عند الاستلام، البطاقات البنكية والائتمانية (عبر Ziina)، والتقسيط عبر تابي أو تمارا.",
      "الإرجاع والاستبدال: خلال 5 أيام من التسليم للقطع غير المستخدمة وغير التالفة في تغليف كابيلا الأصلي. لا تُسترد رسوم الشحن والرسوم البنكية الأصلية، وتُخصم رسوم شحن ثابتة من المبلغ المسترد. تتم معالجة المبالغ المستردة خلال 5 إلى 10 أيام عمل إلى وسيلة الدفع الأصلية.",
      "الخامات: فضة إسترليني عيار 925 وطلاء ذهب أصفر عيار 18، والعديد من القطع مرصعة بالزركون. توضح صفحة كل منتج خامته.",
      `خدمة العملاء: هاتف/واتساب ${PHONE}، البريد الإلكتروني ${EMAIL}. المقر في دبي، الإمارات. ساعات العمل: من الاثنين إلى السبت، 10 صباحاً - 10 مساءً (بتوقيت الإمارات).`,
    ],
    categories: "تسوق حسب الفئة",
    collections: "المجموعات",
    allProducts: "جميع المجوهرات",
    allProductsDesc: "جميع قطع كابيلا في قائمة واحدة",
    products: "المنتجات",
    inStock: "متوفر",
    soldOut: "نفدت الكمية حالياً",
    from: "ابتداءً من",
    policies: "خدمة العملاء والسياسات",
    pages: {
      shipping: ["سياسة الشحن", "مناطق التوصيل في الإمارات ومدته والتتبع والدفع عند الاستلام"],
      returns: ["سياسة الاسترداد والإرجاع", "الإرجاع خلال 5 أيام وشروطه ومدة الاسترداد"],
      contact: ["تواصل معنا", "الهاتف وواتساب والبريد الإلكتروني وساعات العمل والأسئلة الشائعة"],
      about: ["عن كابيلا", "قصة العلامة وفلسفة التصميم"],
    },
    optional: "اختياري",
    legal: {
      privacy: ["سياسة الخصوصية", "كيفية جمع بيانات العملاء واستخدامها"],
      terms: ["شروط الخدمة", "شروط البيع"],
    },
    other: "لغات أخرى",
    otherLink: ["English version", "This file in English"],
  },
} as const;

const link = (text: string, url: string, desc?: string) =>
  `- [${text.trim()}](${url})${desc ? `: ${desc}` : ""}`;

const truncate = (s: string, max: number) =>
  s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;

function collectionName(c: SeoCollection, locale: SeoLocale) {
  // Some Arabic names in the CMS are still English; fall back gracefully.
  return (locale === "ar" ? c.nameAr || c.nameEn : c.nameEn).trim();
}

function productLine(p: SeoProduct, locale: SeoLocale) {
  const t = COPY[locale];
  const isAr = locale === "ar";
  const buyable = p.variants.filter((v) => v.isActive !== false && v.stock > 0);
  const prices = (buyable.length ? buyable : p.variants).map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const material = isAr ? p.material?.nameAr : p.material?.nameEn;
  const short = toPlainText(isAr ? p.shortDescriptionAr : p.shortDescriptionEn);
  const parts = [
    material,
    minPrice !== null
      ? isAr
        ? `${prices.length > 1 ? `${t.from} ` : ""}${minPrice} درهم`
        : `${prices.length > 1 ? `${t.from} ` : ""}AED ${minPrice}`
      : null,
    buyable.length ? t.inStock : t.soldOut,
  ].filter(Boolean);
  const desc = `${parts.join(" · ")}${short ? `. ${truncate(short, 180)}` : ""}`;
  return link(isAr ? p.nameAr : p.nameEn, localeUrl(locale, `/products/${p.slug}`), desc);
}

function collectionLine(c: SeoCollection, locale: SeoLocale, count: number) {
  const desc = toPlainText(locale === "ar" ? c.descriptionAr : c.descriptionEn);
  const countText = locale === "ar" ? `${count} قطعة` : `${count} piece${count === 1 ? "" : "s"}`;
  // Ignore placeholder CMS descriptions ("Amour", "test").
  const text = desc.length >= 40 ? `${countText}. ${truncate(desc, 160)}` : countText;
  return link(collectionName(c, locale), localeUrl(locale, `/collections/${c.slug}`), text);
}

/** Full per-locale llms.txt (served at /en/llms.txt and /ar/llms.txt). */
export async function buildLocaleLlmsTxt(locale: SeoLocale): Promise<string> {
  const t = COPY[locale];
  const [products, collections] = await Promise.all([getSeoProducts(), getSeoCollections()]);
  const countIn = (slug: string) => products.filter((p) => p.collections?.some((c) => c.slug === slug)).length;
  const withProducts = collections.filter((c) => countIn(c.slug) > 0);
  const categories = withProducts.filter((c) => !isDesignCollection(c));
  const designs = withProducts.filter(isDesignCollection);

  // Products grouped by category so assistants can answer "silver rings" etc.
  const grouped = categories.map((cat) => ({
    cat,
    items: products.filter((p) => p.collections?.some((c) => c.slug === cat.slug)),
  }));
  const ungrouped = products.filter(
    (p) => !p.collections?.some((c) => categories.some((cat) => cat.slug === c.slug)),
  );

  const other: SeoLocale = locale === "en" ? "ar" : "en";
  const lines = [
    `# ${t.title}`,
    "",
    `> ${t.summary}`,
    "",
    t.intro,
    "",
    `## ${t.factsTitle}`,
    "",
    ...t.facts.map((f) => `- ${f}`),
    "",
    `## ${t.categories}`,
    "",
    link(t.allProducts, localeUrl(locale, "/collections/all-products"), `${t.allProductsDesc} (${products.length})`),
    ...categories.map((c) => collectionLine(c, locale, countIn(c.slug))),
    "",
    ...(designs.length
      ? [`## ${t.collections}`, "", ...designs.map((c) => collectionLine(c, locale, countIn(c.slug))), ""]
      : []),
    `## ${t.products}`,
    "",
    ...grouped.flatMap(({ cat, items }) =>
      items.length ? [`### ${collectionName(cat, locale)}`, "", ...items.map((p) => productLine(p, locale)), ""] : [],
    ),
    ...(ungrouped.length ? [...ungrouped.map((p) => productLine(p, locale)), ""] : []),
    `## ${t.policies}`,
    "",
    link(t.pages.shipping[0], localeUrl(locale, "/shipping-policy"), t.pages.shipping[1]),
    link(t.pages.returns[0], localeUrl(locale, "/refund-return-policy"), t.pages.returns[1]),
    link(t.pages.contact[0], localeUrl(locale, "/contact"), t.pages.contact[1]),
    link(t.pages.about[0], localeUrl(locale, "/about"), t.pages.about[1]),
    "",
    `## ${t.optional}`,
    "",
    link(t.legal.privacy[0], localeUrl(locale, "/privacy-policy"), t.legal.privacy[1]),
    link(t.legal.terms[0], localeUrl(locale, "/terms-of-service"), t.legal.terms[1]),
    link(t.otherLink[0], `${SITE_CONFIG.url}/${other}/llms.txt`, t.otherLink[1]),
    link("Sitemap", `${SITE_CONFIG.url}/sitemap.xml`, locale === "ar" ? "جميع صفحات الموقع" : "Every page on the site"),
    "",
  ];
  return lines.join("\n");
}

/** Root /llms.txt: bilingual entry point linking to the full per-language files. */
export async function buildRootLlmsTxt(): Promise<string> {
  const en = COPY.en;
  const ar = COPY.ar;
  const [products, collections] = await Promise.all([getSeoProducts(), getSeoCollections()]);
  const countIn = (slug: string) => products.filter((p) => p.collections?.some((c) => c.slug === slug)).length;
  const live = collections.filter((c) => countIn(c.slug) > 0);
  const categories = live.filter((c) => !isDesignCollection(c));
  const designs = live.filter(isDesignCollection);

  return [
    "# Capella (كابيلا)",
    "",
    `> ${en.summary}`,
    "",
    en.intro,
    "",
    `${ar.summary}`,
    "",
    "## Full details / التفاصيل الكاملة",
    "",
    link("English: catalogue, prices and policies", `${SITE_CONFIG.url}/en/llms.txt`, `All ${products.length} products with material, price and availability, plus shipping, payment and return policies`),
    link("العربية: المنتجات والأسعار والسياسات", `${SITE_CONFIG.url}/ar/llms.txt`, `جميع المنتجات (${products.length}) مع الخامة والسعر والتوفر وسياسات الشحن والدفع والإرجاع`),
    "",
    `## ${en.factsTitle}`,
    "",
    ...en.facts.map((f) => `- ${f}`),
    "",
    "## Shop / تسوق",
    "",
    link(`${en.allProducts} / ${ar.allProducts}`, localeUrl("en", "/collections/all-products"), `${products.length} pieces`),
    ...categories.map((c) =>
      link(`${c.nameEn.trim()} / ${collectionName(c, "ar")}`, localeUrl("en", `/collections/${c.slug}`), `${countIn(c.slug)} pieces · Arabic: ${localeUrl("ar", `/collections/${c.slug}`)}`),
    ),
    ...designs.map((c) =>
      link(c.nameEn.trim(), localeUrl("en", `/collections/${c.slug}`), `${countIn(c.slug)} pieces · Arabic: ${localeUrl("ar", `/collections/${c.slug}`)}`),
    ),
    "",
    `## ${en.policies}`,
    "",
    link(en.pages.shipping[0], localeUrl("en", "/shipping-policy"), en.pages.shipping[1]),
    link(en.pages.returns[0], localeUrl("en", "/refund-return-policy"), en.pages.returns[1]),
    link(en.pages.contact[0], localeUrl("en", "/contact"), en.pages.contact[1]),
    link(en.pages.about[0], localeUrl("en", "/about"), en.pages.about[1]),
    "",
    `## ${en.optional}`,
    "",
    link(en.legal.privacy[0], localeUrl("en", "/privacy-policy"), en.legal.privacy[1]),
    link(en.legal.terms[0], localeUrl("en", "/terms-of-service"), en.legal.terms[1]),
    link("Sitemap", `${SITE_CONFIG.url}/sitemap.xml`, "Every page on the site, in English and Arabic"),
    "",
  ].join("\n");
}

export function llmsResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
