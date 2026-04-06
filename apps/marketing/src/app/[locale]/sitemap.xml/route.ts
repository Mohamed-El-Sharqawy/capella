import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nznstudio.com";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
}

// Static pages with their SEO priorities
const staticPages: SitemapEntry[] = [
  // High priority - Main pages (1.0, daily)
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/collections", priority: 1.0, changeFrequency: "daily" },
  { path: "/collections/all-products", priority: 1.0, changeFrequency: "daily" },
  
  // Medium priority - Informational pages (0.6, weekly)
  { path: "/contact", priority: 0.6, changeFrequency: "weekly" },
  
  // Lower priority - Legal/Policy pages (0.3, monthly)
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms-of-service", priority: 0.3, changeFrequency: "monthly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/return-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/shipping-policy", priority: 0.3, changeFrequency: "monthly" },
];

// Fetch featured home collections (the 5 hero collections)
async function getFeaturedHomeCollections(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const data = await apiGet<{ data: any[] }>("/api/collections/featured-home", { next: { revalidate: 3600 } });
    return (data?.data || []).map((c: any) => ({
      slug: c.slug,
      updatedAt: c.updatedAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function getProducts(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const data = await apiGet<{ data: { data: any[] } }>("/api/products?limit=1000&isActive=true", { next: { revalidate: 3600 } });
    return (data?.data?.data || []).map((p: any) => ({
      slug: p.slug,
      updatedAt: p.updatedAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function getCollections(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const data = await apiGet<{ data: any[] }>("/api/collections", { next: { revalidate: 3600 } });
    
    // Flatten collections including children
    const allCollections: Array<{ slug: string; updatedAt: string }> = [];
    for (const c of data?.data || []) {
      allCollections.push({
        slug: c.slug,
        updatedAt: c.updatedAt || new Date().toISOString(),
      });
      
      // Add children collections
      if (c.children && Array.isArray(c.children)) {
        for (const child of c.children) {
          allCollections.push({
            slug: child.slug,
            updatedAt: child.updatedAt || new Date().toISOString(),
          });
        }
      }
    }
    
    return allCollections;
  } catch {
    return [];
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

  const [products, collections, featuredCollections] = await Promise.all([
    getProducts(),
    getCollections(),
    getFeaturedHomeCollections(),
  ]);

  const sitemapEntries: MetadataRoute.Sitemap = [];
  const featuredSlugs = new Set(featuredCollections.map((c) => c.slug));

  // Add static pages for this locale
  for (const page of staticPages) {
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // Add featured home collections (priority: 0.8, daily) - the 5 hero collections
  for (const collection of featuredCollections) {
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}/collections/${collection.slug}`,
      lastModified: new Date(collection.updatedAt),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // Add product pages (priority: 0.9, daily)
  for (const product of products) {
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}/products/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  // Add other collection pages (priority: 0.7, weekly) - exclude featured ones
  for (const collection of collections) {
    // Skip if already added as featured collection
    if (featuredSlugs.has(collection.slug)) continue;
    
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}/collections/${collection.slug}`,
      lastModified: new Date(collection.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
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
