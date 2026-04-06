import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nznstudio.com";

interface Product {
  slug: string;
  updatedAt: string;
  name?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

async function getProducts(): Promise<Product[]> {
  try {
    const data = await apiGet<{ data: { data: Product[] } }>("/api/products?limit=1000&isActive=true", { next: { revalidate: 3600 } });
    return (data?.data?.data || []).map((p: any) => ({
      slug: p.slug,
      updatedAt: p.updatedAt || new Date().toISOString(),
      name: p.name,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
    }));
  } catch {
    return [];
  }
}

async function getFeaturedProducts(): Promise<Set<string>> {
  try {
    const data = await apiGet<{ data: Product[] }>("/api/products/featured", { next: { revalidate: 3600 } });
    return new Set((data?.data || []).map((p: any) => p.slug));
  } catch {
    return new Set();
  }
}

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

  const [products, featuredSlugs] = await Promise.all([
    getProducts(),
    getFeaturedProducts(),
  ]);

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Products are high priority for e-commerce SEO
  // Featured products get highest priority (0.95), regular products get (0.85)
  for (const product of products) {
    const isFeatured = featuredSlugs.has(product.slug);
    
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}/products/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "daily",
      priority: isFeatured ? 0.95 : 0.85,
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
