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
  const parentId = product.collection?.parentId;
  let products: any[] = [];

  try {
    // 1. Fetch from the same collection
    if (collectionId) {
      const resp = await apiGet<{ data: { data: any[] } }>(
        `/api/products?limit=8&collectionId=${collectionId}`,
        { next: { revalidate: 60 } }
      );
      products = (resp.data.data || []).filter((p: any) => p.id !== excludeId);
    }

    // 2. If we need more, fetch from the parent collection
    if (products.length < 4 && parentId) {
      const resp = await apiGet<{ data: { data: any[] } }>(
        `/api/products?limit=8&collectionId=${parentId}`,
        { next: { revalidate: 60 } }
      );
      const parentProducts = (resp.data.data || []).filter(
        (p: any) => p.id !== excludeId && !products.some((existing) => existing.id === p.id)
      );
      products = [...products, ...parentProducts];
    }

    // 3. Fallback to featured products if still not enough
    if (products.length < 4) {
      const resp = await apiGet<{ data: { data: any[] } }>(
        "/api/products?limit=8&isFeatured=true",
        { next: { revalidate: 60 } }
      );
      const featured = (resp.data.data || []).filter(
        (p: any) => p.id !== excludeId && !products.some((existing) => existing.id === p.id)
      );
      products = [...products, ...featured];
    }
    
    // 4. Final fallback to any products if still under 4
    if (products.length < 4) {
      const resp = await apiGet<{ data: { data: any[] } }>(
        "/api/products?limit=8&isActive=true",
        { next: { revalidate: 60 } }
      );
      const others = (resp.data.data || []).filter(
        (p: any) => p.id !== excludeId && !products.some((existing) => existing.id === p.id)
      );
      products = [...products, ...others];
    }

    return products.slice(0, 4);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return products.slice(0, 4);
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
