const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nznstudio.com";

const locales = ["en", "ar"];

function generateSitemapIndex(): string {
  const sitemaps: string[] = [];

  for (const locale of locales) {
    // Main locale sitemap (pages, products, collections combined)
    sitemaps.push(`${BASE_URL}/${locale}/sitemap.xml`);
    
    // Individual sitemaps for better organization
    sitemaps.push(`${BASE_URL}/${locale}/sitemap-pages.xml`);
    sitemaps.push(`${BASE_URL}/${locale}/sitemap-products.xml`);
    sitemaps.push(`${BASE_URL}/${locale}/sitemap-collections.xml`);
  }

  const sitemapEntries = sitemaps
    .map(
      (url) =>
        `<sitemap><loc>${url}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries}</sitemapindex>`;
}

export async function GET() {
  const xml = generateSitemapIndex();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
