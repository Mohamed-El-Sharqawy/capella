import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nznstudio.com";

interface Collection {
  slug: string;
  updatedAt: string;
  name?: string;
  children?: Collection[];
}

async function getCollections(): Promise<Collection[]> {
  try {
    const data = await apiGet<{ data: Collection[] }>("/api/collections", { next: { revalidate: 3600 } });
    
    // Flatten collections including children
    const allCollections: Collection[] = [];
    for (const c of data?.data || []) {
      allCollections.push({
        slug: c.slug,
        updatedAt: c.updatedAt || new Date().toISOString(),
        name: c.name,
      });
      
      // Add children collections
      if (c.children && Array.isArray(c.children)) {
        for (const child of c.children) {
          allCollections.push({
            slug: child.slug,
            updatedAt: child.updatedAt || new Date().toISOString(),
            name: child.name,
          });
        }
      }
    }
    
    return allCollections;
  } catch {
    return [];
  }
}

async function getFeaturedHomeCollections(): Promise<Set<string>> {
  try {
    const data = await apiGet<{ data: Collection[] }>("/api/collections/featured-home", { next: { revalidate: 3600 } });
    return new Set((data?.data || []).map((c: any) => c.slug));
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

  const [collections, featuredSlugs] = await Promise.all([
    getCollections(),
    getFeaturedHomeCollections(),
  ]);

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Collections are important for category-based navigation
  // Featured/hero collections get higher priority (0.9), regular collections get (0.75)
  for (const collection of collections) {
    const isFeatured = featuredSlugs.has(collection.slug);
    
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}/collections/${collection.slug}`,
      lastModified: new Date(collection.updatedAt),
      changeFrequency: isFeatured ? "daily" : "weekly",
      priority: isFeatured ? 0.9 : 0.75,
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
