/**
 * Shared catalog data + helpers for crawler-facing routes (sitemaps,
 * llms.txt). Everything here is cached for an hour via Next's fetch cache.
 */
import { apiGet } from "./api-client";
import { SITE_CONFIG } from "./metadata";

export const SEO_LOCALES = ["en", "ar"] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];

const REVALIDATE = { next: { revalidate: 3600 } } as const;

export interface SeoVariant {
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isActive?: boolean;
  sku?: string | null;
  images?: { url: string }[];
}

export interface SeoProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn?: string | null;
  shortDescriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  updatedAt?: string;
  material?: { nameEn: string; nameAr: string } | null;
  stone?: { nameEn: string; nameAr: string } | null;
  variants: SeoVariant[];
  collections?: { slug: string; nameEn: string; nameAr: string }[];
}

export interface SeoCollection {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  updatedAt?: string;
  parentId?: string | null;
}

/** Static, indexable pages (path after the locale). */
export const STATIC_SEO_PAGES = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/collections", priority: 0.9, changeFrequency: "daily" },
  { path: "/collections/all-products", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/shipping-policy", priority: 0.4, changeFrequency: "monthly" },
  { path: "/refund-return-policy", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms-of-service", priority: 0.2, changeFrequency: "yearly" },
] as const;

export async function getSeoProducts(): Promise<SeoProduct[]> {
  try {
    const res = await apiGet<{ data: { data: SeoProduct[] } }>(
      "/api/products?limit=1000&isActive=true",
      REVALIDATE,
    );
    return res?.data?.data ?? [];
  } catch {
    return [];
  }
}

/**
 * All indexable collections: the main list (with children) plus the
 * homepage-featured ones (category collections like rings/earrings live
 * there), de-duplicated by slug.
 */
export async function getSeoCollections(): Promise<SeoCollection[]> {
  const [main, featured] = await Promise.all([
    apiGet<{ data: (SeoCollection & { children?: SeoCollection[] })[] }>("/api/collections", REVALIDATE)
      .then((r) => r?.data ?? [])
      .catch(() => []),
    apiGet<{ data: SeoCollection[] }>("/api/collections/featured-home", REVALIDATE)
      .then((r) => r?.data ?? [])
      .catch(() => []),
  ]);
  const bySlug = new Map<string, SeoCollection>();
  for (const c of [...featured, ...main.flatMap((c) => [c, ...(c.children ?? [])])]) {
    if (c?.slug && !bySlug.has(c.slug)) bySlug.set(c.slug, c);
  }
  return [...bySlug.values()];
}

export function localeUrl(locale: string, path: string) {
  return `${SITE_CONFIG.url}/${locale}${path}`;
}

export { toPlainText } from "./text";

// ---------------------------------------------------------------------------
// Sitemaps
// ---------------------------------------------------------------------------

export interface SitemapUrl {
  /** Path after the locale, e.g. "/products/amour-ring" ("" = home). */
  path: string;
  lastModified?: string | Date;
  changeFrequency?: string;
  priority?: number;
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * <urlset> for one locale. Every URL lists its en/ar alternates and an
 * x-default (English), so Google pairs the language versions instead of
 * treating them as duplicates.
 */
export function buildUrlset(locale: string, urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const alternates = [
        ...SEO_LOCALES.map(
          (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(localeUrl(l, u.path))}"/>`,
        ),
        `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(localeUrl("en", u.path))}"/>`,
      ].join("");
      const lastmod = u.lastModified ? `<lastmod>${new Date(u.lastModified).toISOString()}</lastmod>` : "";
      const changefreq = u.changeFrequency ? `<changefreq>${u.changeFrequency}</changefreq>` : "";
      const priority = u.priority !== undefined ? `<priority>${u.priority.toFixed(1)}</priority>` : "";
      return `<url><loc>${xmlEscape(localeUrl(locale, u.path))}</loc>${alternates}${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

/** Static pages carry no lastmod: a fake "now" teaches Google to ignore lastmod. */
export function staticPageUrls(): SitemapUrl[] {
  return STATIC_SEO_PAGES.map((p) => ({
    path: p.path,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}

export function productUrls(products: SeoProduct[]): SitemapUrl[] {
  return products.map((p) => ({
    path: `/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}

export function collectionUrls(collections: SeoCollection[]): SitemapUrl[] {
  return collections.map((c) => ({
    path: `/collections/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}
