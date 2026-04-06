import { api } from "@/lib/api";
import type { Collection } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface CollectionImage {
  id: string;
  url: string;
  publicId: string;
  altEn?: string | null;
  altAr?: string | null;
}

export interface CreateCollectionBody {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  metaTitleEn?: string;
  metaTitleAr?: string;
  metaDescriptionEn?: string;
  metaDescriptionAr?: string;
}

export type UpdateCollectionBody = Partial<CreateCollectionBody>;

export function createCollection(body: CreateCollectionBody) {
  return api.post<ApiResponse<Collection>>("/api/collections", body);
}

export function updateCollection(id: string, body: UpdateCollectionBody) {
  return api.put<ApiResponse<Collection>>(`/api/collections/${id}`, body);
}

export function deleteCollection(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/collections/${id}`);
}

export function uploadCollectionImage(
  collectionId: string,
  file: File,
  altEn?: string,
  altAr?: string
) {
  const formData = new FormData();
  formData.append("file", file);
  if (altEn) formData.append("altEn", altEn);
  if (altAr) formData.append("altAr", altAr);
  return api.post<ApiResponse<CollectionImage>>(
    `/api/images/collections/${collectionId}`,
    formData
  );
}

export function deleteCollectionImage(collectionId: string) {
  return api.delete<ApiResponse<{ message: string }>>(
    `/api/images/collections/${collectionId}`
  );
}
