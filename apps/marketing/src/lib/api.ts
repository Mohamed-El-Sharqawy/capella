import type { Product, Collection, ShoppableVideo, InstagramPost, Review, Banner } from "@ecommerce/shared-types";
import { apiGet } from "./api-client";

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, next } = options;
  return apiGet<T>(endpoint, { token, next: next as any });
}

export const api = {
  products: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return apiFetch<PaginatedResponse<Product>>(`/api/products${query}`);
    },
    featured: () => {
      return apiFetch<PaginatedResponse<Product>>(`/api/products?isFeatured=true`);
    },
    get: (slug: string) =>
      apiFetch<SingleResponse<Product>>(`/api/products/${slug}`),
  },
  collections: {
    list: () => apiFetch<PaginatedResponse<Collection>>("/api/collections"),
    get: (slug: string) =>
      apiFetch<SingleResponse<Collection>>(`/api/collections/${slug}`),
  },
};

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const data = await apiGet<{ data: { data: Product[] } }>(
      "/api/products?isFeatured=true&limit=8",
      { next: { revalidate: 60 } }
    );
    return data?.data?.data ?? [];
  } catch {
    return [];
  }
}

export async function getShoppableVideos(): Promise<ShoppableVideo[]> {
  try {
    const data = await apiGet<{ data: ShoppableVideo[] }>(
      "/api/shoppable-videos",
      { next: { revalidate: 60 } }
    );
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const data = await apiGet<{ data: InstagramPost[] }>(
      "/api/instagram-posts",
      { next: { revalidate: 60 } }
    );
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const data = await apiGet<Review[]>(
      "/api/reviews/homepage",
      { next: { revalidate: 60 } }
    );
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const data = await apiGet<{ data: Banner[] }>(
      "/api/banners?isActive=true",
      { next: { revalidate: 60 } }
    );
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export async function getFeaturedHomeCollections(): Promise<Collection[]> {
  try {
    const data = await apiGet<{ data: Collection[] }>(
      "/api/collections/featured-home",
      { next: { revalidate: 60 } }
    );
    return data?.data ?? [];
  } catch {
    return [];
  }
}
