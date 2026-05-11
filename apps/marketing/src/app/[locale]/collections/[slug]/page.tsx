import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { CollectionPageClient } from "./client";
import { generateCollectionMetadata, generatePageMetadata, STATIC_PAGE_METADATA } from "@/lib/metadata";
import { apiGet } from "@/lib/api-client";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getCollection(slug: string) {
  try {
    const data = await apiGet<{ data: any }>(`/api/collections/${slug}`, { next: { revalidate: 60 } });
    return data?.data ?? null;
  } catch {
    return null;
  }
}

async function getCollections() {
  try {
    const data = await apiGet<{ data: any[] }>("/api/collections", { next: { revalidate: 60 } });
    return data?.data ?? [];
  } catch {
    return [];
  }
}

async function getInitialProducts(slug: string) {
  try {
    const params = new URLSearchParams({
      limit: "32",
      page: "1",
      isActive: "true",
      sortBy: "position",
      sortOrder: "asc",
    });

    // Handle special slugs
    if (slug !== "all-products") {
      // Use collectionSlug - backend will include children's products
      params.set("collectionSlug", slug);
    }

    const response = await apiGet<{ data: any }>(`/api/products?${params}`, { next: { revalidate: 60 } });
    return response?.data ?? { data: [], meta: { total: 0, page: 1, limit: 32, totalPages: 0 } };
  } catch {
    return { data: [], meta: { total: 0, page: 1, limit: 32, totalPages: 0 } };
  }
}

// Generate static params for all collections
export async function generateStaticParams() {
  try {
    const data = await apiGet<{ data: any[] }>("/api/collections", { next: { revalidate: 60 } });
    const collections = data?.data || [];
    
    // Generate params for both locales, including children
    const params: { locale: string; slug: string }[] = [];
    
    // Add static slugs
    params.push({ locale: "en", slug: "all-products" });
    params.push({ locale: "ar", slug: "all-products" });
    
    for (const collection of collections) {
      params.push({ locale: "en", slug: collection.slug });
      params.push({ locale: "ar", slug: collection.slug });
      
      // Add children collections
      if (collection.children && Array.isArray(collection.children)) {
        for (const child of collection.children) {
          params.push({ locale: "en", slug: child.slug });
          params.push({ locale: "ar", slug: child.slug });
        }
      }
    }
    return params;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const isArabic = locale === "ar";
  const tc = await getTranslations({ locale, namespace: "collection" });

  // Handle special slugs
  if (slug === "all-products") {
    return generatePageMetadata({
      title: tc("allProductsTitle"),
      description: tc("allProductsDesc"),
      locale,
      path: `/collections/${slug}`,
    });
  }

  const collection = await getCollection(slug);
  
  if (!collection) {
    return { title: tc("notFound") };
  }

  return generateCollectionMetadata({ collection, locale });
}

export default async function CollectionPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, collections, initialData] = await Promise.all([
    getTranslations("collection"),
    getCollections(),
    getInitialProducts(slug),
  ]);

  const currentCollection = slug === "all-products"
    ? null
    : collections.find((c: any) => c.slug === slug) ??
      (await getCollection(slug));

  const videoUrl = (currentCollection as any)?.video?.url ?? null;

  const getTitle = () => {
    if (slug === "all-products") return t("allProducts");
    if (slug === "men") return t("men");
    if (slug === "women") return t("women");
    const collection = collections.find((c: any) => c.slug === slug);
    return locale === "ar" ? collection?.nameAr : collection?.nameEn;
  };

  return (
    <CollectionPageClient
      locale={locale}
      slug={slug}
      title={getTitle() || slug}
      collections={collections}
      initialProducts={initialData.data}
      initialMeta={initialData.meta}
      videoUrl={videoUrl}
    />
  );
}
