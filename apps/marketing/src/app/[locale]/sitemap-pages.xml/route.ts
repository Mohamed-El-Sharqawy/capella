import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nznstudio.com";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface PageEntry {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
}

// Static pages with SEO priorities optimized for e-commerce
const staticPages: PageEntry[] = [
  // Highest priority - Homepage (1.0, daily) - Main entry point
  { path: "", priority: 1.0, changeFrequency: "daily" },
  
  // High priority - Shopping pages (0.9, daily) - Revenue generating
  { path: "/collections", priority: 0.9, changeFrequency: "daily" },
  { path: "/collections/all-products", priority: 0.9, changeFrequency: "daily" },
  
  // Medium priority - Contact/Support (0.6, weekly) - Customer service
  { path: "/contact", priority: 0.6, changeFrequency: "weekly" },
  
  // Lower priority - Legal/Policy pages (0.3, monthly) - Required but low traffic
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms-of-service", priority: 0.3, changeFrequency: "monthly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/return-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/shipping-policy", priority: 0.3, changeFrequency: "monthly" },
];

function generateSitemapXml(entries: MetadataRoute.Sitemap): string {
  const urlEntries = entries
    .map((entry) => {
      const lastmod = entry.lastModified
        ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
        : "";
      const changefreq = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : "";
      const priority = entry.priority !== undefined
        ? `<priority>${entry.priority}</priority>`
        : "";
      return `<url><loc>${entry.url}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`;
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { locale } = await params;

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static pages for this locale
  for (const page of staticPages) {
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  const xml = generateSitemapXml(sitemapEntries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
