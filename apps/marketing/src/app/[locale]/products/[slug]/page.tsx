import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageClient } from "./client";
import { generateProductMetadata } from "@/lib/metadata";
import { apiGet } from "@/lib/api-client";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const data = await apiGet<{ data: any }>(`/api/products/${slug}`, { next: { revalidate: 60 } });
    return data.data;
  } catch {
    return null;
  }
}

async function getRelatedProducts(product: any) {
  const excludeId = product.id;
  const collectionId = product.collectionId;
  
  // First, try to get products from the same collection
  if (collectionId) {
    try {
      const params = new URLSearchParams({ limit: "6", collectionId });
      const data = await apiGet<{ data: { data: any[] } }>(`/api/products?${params}`, { next: { revalidate: 60 } });
      const products = (data.data.data || []).filter((p: any) => p.id !== excludeId);
      
      // If we have enough products from the same collection, return them
      if (products.length >= 3) {
        return products.slice(0, 4);
      }
      
      // If not enough, try to get more from parent collection
      if (product.collection?.parentId) {
        try {
          const parentParams = new URLSearchParams({ limit: "6", collectionId: product.collection.parentId });
          const parentData = await apiGet<{ data: { data: any[] } }>(`/api/products?${parentParams}`, { next: { revalidate: 10 } });
          const parentProducts = (parentData.data.data || []).filter(
            (p: any) => p.id !== excludeId && !products.find((existing: any) => existing.id === p.id)
          );
          // Combine: products from same collection first, then parent collection
          return [...products, ...parentProducts].slice(0, 4);
        } catch {
          // Ignore parent fetch error
        }
      }
      
      return products.slice(0, 4);
    } catch {
      // Fall through to fallback
    }
  }
  
  // Fallback: get featured products if no collection
  try {
    const fallbackData = await apiGet<{ data: { data: any[] } }>("/api/products?limit=4&isFeatured=true", { next: { revalidate: 10 } });
    return (fallbackData.data.data || []).filter((p: any) => p.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

// Generate static params for all active products
export async function generateStaticParams() {
  try {
    const data = await apiGet<{ data: { data: any[] } }>("/api/products?limit=1000&isActive=true", { next: { revalidate: 10 } });
    const products = data?.data?.data || [];
    
    // Generate params for both locales
    const params: { locale: string; slug: string }[] = [];
    for (const product of products) {
      params.push({ locale: "en", slug: product.slug });
      params.push({ locale: "ar", slug: product.slug });
    }
    return params;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  
  if (!product) {
    return { title: "Product Not Found" };
  }

  return generateProductMetadata({ product, locale });
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);

  return (
    <ProductPageClient 
      product={product} 
      relatedProducts={relatedProducts}
      locale={locale} 
    />
  );
}
