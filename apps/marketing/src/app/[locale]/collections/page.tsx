import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CollectionsPageClient } from "./client";
import { generatePageMetadata, STATIC_PAGE_METADATA } from "@/lib/metadata";
import type { Collection } from "@ecommerce/shared-types";
import { apiGet } from "@/lib/api-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const content = isArabic ? STATIC_PAGE_METADATA.collections.ar : STATIC_PAGE_METADATA.collections.en;

  return generatePageMetadata({
    title: content.title,
    description: content.description,
    locale,
    path: "/collections",
  });
}

async function getCollections(): Promise<Collection[]> {
  try {
    const data = await apiGet<{ data: Collection[] }>("/api/collections", { next: { revalidate: 10 } });
    const collections = data?.data ?? [];
    // Filter out collections with 0 products
    return collections.filter((c: Collection) => (c?._count?.products ?? 0) > 0);
  } catch {
    return [];
  }
}

export default async function CollectionsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const collections = await getCollections();

  return (
    <CollectionsPageClient
      collections={collections}
      locale={locale}
    />
  );
}
