import { SITE_CONFIG } from "@/lib/metadata";
import { SEO_LOCALES, xmlResponse } from "@/lib/seo-data";

/**
 * Sitemap index. Lists each URL exactly once (split by type per locale);
 * the combined /{locale}/sitemap.xml still exists but isn't listed here so
 * Google doesn't read every URL twice.
 */
export async function GET() {
  const entries = SEO_LOCALES.flatMap((locale) =>
    ["sitemap-pages.xml", "sitemap-collections.xml", "sitemap-products.xml"].map(
      (file) => `<sitemap><loc>${SITE_CONFIG.url}/${locale}/${file}</loc></sitemap>`,
    ),
  ).join("");
  return xmlResponse(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`,
  );
}
