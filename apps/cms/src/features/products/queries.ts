import { api } from "@/lib/api";
import type { Product } from "@ecommerce/shared-types";
import type { PaginatedResponse, ApiResponse } from "@ecommerce/shared-types";

export function fetchProducts(params?: Record<string, string>) {
  return api.get<ApiResponse<PaginatedResponse<Product>>>("/api/products", params);
}

export function fetchProduct(slug: string) {
  return api.get<ApiResponse<Product>>(`/api/products/${slug}`);
}
