import { api } from "@/lib/api";
import type { Collection } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export function fetchCollections() {
  return api.get<ApiResponse<Collection[]>>("/api/collections");
}

export function fetchAllCollections() {
  return api.get<ApiResponse<Collection[]>>("/api/collections/all");
}

export function fetchCollection(slug: string) {
  return api.get<ApiResponse<Collection>>(`/api/collections/${slug}`);
}
