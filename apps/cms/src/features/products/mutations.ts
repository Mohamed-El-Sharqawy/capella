import { api } from "@/lib/api";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface CreateProductBody {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  shortDescriptionEn?: string;
  shortDescriptionAr?: string;
  metaTitleEn?: string;
  metaTitleAr?: string;
  metaDescriptionEn?: string;
  metaDescriptionAr?: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
  collectionId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  variants?: CreateVariantBody[];
}

export interface UpdateProductBody extends Partial<Omit<CreateProductBody, "variants">> {
  defaultVariantId?: string | null;
  hoverVariantId?: string | null;
}

export interface CreateVariantBody {
  nameEn: string;
  nameAr: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  sizeId?: string;
  colorId?: string;
  stock?: number;
  isActive?: boolean;
  metaTitleEn?: string;
  metaTitleAr?: string;
  metaDescriptionEn?: string;
  metaDescriptionAr?: string;
}

export interface UpdateVariantBody {
  nameEn?: string;
  nameAr?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  sizeId?: string | null;
  colorId?: string | null;
  stock?: number;
  isActive?: boolean;
  metaTitleEn?: string;
  metaTitleAr?: string;
  metaDescriptionEn?: string;
  metaDescriptionAr?: string;
}

export function createProduct(body: CreateProductBody) {
  return api.post<ApiResponse<Product>>("/api/products", body);
}

export function updateProduct(id: string, body: UpdateProductBody) {
  return api.put<ApiResponse<Product>>(`/api/products/${id}`, body);
}

export function deleteProduct(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/products/${id}`);
}

export function createVariant(productId: string, body: CreateVariantBody) {
  return api.post<ApiResponse<ProductVariant>>(`/api/products/${productId}/variants`, body);
}

export function updateVariant(variantId: string, body: UpdateVariantBody) {
  return api.put<ApiResponse<ProductVariant>>(`/api/products/variants/${variantId}`, body);
}

export function deleteVariant(variantId: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/products/variants/${variantId}`);
}

export interface VariantImage {
  id: string;
  url: string;
  publicId: string;
  altEn?: string | null;
  altAr?: string | null;
  position: number;
}

export function uploadVariantImages(
  variantId: string,
  files: File[],
  altEn?: string,
  altAr?: string
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (altEn) formData.append("altEn", altEn);
  if (altAr) formData.append("altAr", altAr);
  return api.post<ApiResponse<VariantImage[]>>(
    `/api/images/variants/${variantId}/upload`,
    formData
  );
}

export function deleteVariantImage(linkId: string) {
  return api.delete<ApiResponse<{ message: string }>>(
    `/api/images/variants/link/${linkId}`
  );
}

export interface SizeGuideResult {
  sizeGuideUrl: string;
  sizeGuidePublicId: string;
}

export function uploadSizeGuide(productId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<ApiResponse<SizeGuideResult>>(
    `/api/images/size-guide/${productId}`,
    formData
  );
}

export function deleteSizeGuide(productId: string) {
  return api.delete<ApiResponse<{ message: string }>>(
    `/api/images/size-guide/${productId}`
  );
}

// Product-level images
export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId: string;
  altEn?: string | null;
  altAr?: string | null;
  createdAt: string;
  variantImages?: Array<{
    id: string;
    variantId: string;
    position: number;
    variant: { id: string; nameEn: string; nameAr: string };
  }>;
}

export function uploadProductImages(
  productId: string,
  files: File[],
  altEn?: string,
  altAr?: string
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (altEn) formData.append("altEn", altEn);
  if (altAr) formData.append("altAr", altAr);
  return api.post<ApiResponse<ProductImage[]>>(
    `/api/images/products/${productId}`,
    formData
  );
}

export function getProductImages(productId: string) {
  return api.get<ApiResponse<ProductImage[]>>(
    `/api/images/products/${productId}`
  );
}

export function deleteProductImage(imageId: string) {
  return api.delete<ApiResponse<{ message: string }>>(
    `/api/images/products/image/${imageId}`
  );
}

export function updateProductImageAlt(imageId: string, altEn?: string, altAr?: string) {
  return api.patch<ApiResponse<ProductImage>>(
    `/api/images/products/image/${imageId}`,
    { altEn, altAr }
  );
}

// Link/unlink images to variants
export function linkImageToVariant(imageId: string, variantId: string, position?: number) {
  return api.post<ApiResponse<unknown>>(
    `/api/images/link`,
    { imageId, variantId, position }
  );
}

export function linkImageToVariants(imageId: string, variantIds: string[]) {
  return api.post<ApiResponse<unknown>>(
    `/api/images/link-multiple`,
    { imageId, variantIds }
  );
}

export function unlinkImageFromVariant(imageId: string, variantId: string) {
  return api.delete<ApiResponse<{ message: string }>>(
    `/api/images/link/${imageId}/${variantId}`
  );
}

export function reorderVariantImages(variantId: string, imageIds: string[]) {
  return api.post<ApiResponse<unknown>>(
    `/api/images/variants/${variantId}/reorder`,
    { imageIds }
  );
}
