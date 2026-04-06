import { api } from "@/lib/api";
import type { ShoppableVideo, InstagramPost, Banner } from "@ecommerce/shared-types";

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Shoppable Videos
export function getShoppableVideos() {
  return api.get<ApiResponse<ShoppableVideo[]>>("/api/shoppable-videos/admin");
}

export function getShoppableVideo(id: string) {
  return api.get<ApiResponse<ShoppableVideo>>(`/api/shoppable-videos/admin/${id}`);
}

export function createShoppableVideo(data: {
  video: File;
  thumbnail: File;
  productId: string;
  position?: number;
  isActive?: boolean;
}) {
  const formData = new FormData();
  formData.append("video", data.video);
  formData.append("thumbnail", data.thumbnail);
  formData.append("productId", data.productId);
  if (data.position !== undefined) formData.append("position", String(data.position));
  if (data.isActive !== undefined) formData.append("isActive", String(data.isActive));
  
  return api.post<ApiResponse<ShoppableVideo>>("/api/shoppable-videos", formData);
}

export function updateShoppableVideo(id: string, data: {
  productId?: string;
  position?: number;
  isActive?: boolean;
}) {
  return api.patch<ApiResponse<ShoppableVideo>>(`/api/shoppable-videos/${id}`, data);
}

export function deleteShoppableVideo(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/shoppable-videos/${id}`);
}

export function reorderShoppableVideos(ids: string[]) {
  return api.post<ApiResponse<{ message: string }>>("/api/shoppable-videos/reorder", { ids });
}

// Instagram Posts
export function getInstagramPosts() {
  return api.get<ApiResponse<InstagramPost[]>>("/api/instagram-posts/admin");
}

export function getInstagramPost(id: string) {
  return api.get<ApiResponse<InstagramPost>>(`/api/instagram-posts/admin/${id}`);
}

export function createInstagramPost(data: {
  image: File;
  linkUrl?: string;
  altEn?: string;
  altAr?: string;
  position?: number;
  isActive?: boolean;
}) {
  const formData = new FormData();
  formData.append("image", data.image);
  if (data.linkUrl) formData.append("linkUrl", data.linkUrl);
  if (data.altEn) formData.append("altEn", data.altEn);
  if (data.altAr) formData.append("altAr", data.altAr);
  if (data.position !== undefined) formData.append("position", String(data.position));
  if (data.isActive !== undefined) formData.append("isActive", String(data.isActive));
  
  return api.post<ApiResponse<InstagramPost>>("/api/instagram-posts", formData);
}

export function updateInstagramPost(id: string, data: {
  linkUrl?: string;
  altEn?: string;
  altAr?: string;
  position?: number;
  isActive?: boolean;
}) {
  return api.patch<ApiResponse<InstagramPost>>(`/api/instagram-posts/${id}`, data);
}

export function deleteInstagramPost(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/instagram-posts/${id}`);
}

export function reorderInstagramPosts(ids: string[]) {
  return api.post<ApiResponse<{ message: string }>>("/api/instagram-posts/reorder", { ids });
}

// Banners
export function getBanners() {
  return api.get<ApiResponse<Banner[]>>("/api/banners");
}

export function getBanner(id: string) {
  return api.get<ApiResponse<Banner>>(`/api/banners/${id}`);
}

export function createBanner(data: {
  titleEn: string;
  titleAr: string;
  subtitleEn?: string;
  subtitleAr?: string;
  buttonTextEn?: string;
  buttonTextAr?: string;
  imageUrl: string;
  publicId: string;
  linkUrl?: string;
  position?: number;
  isActive?: boolean;
}) {
  return api.post<ApiResponse<Banner>>("/api/banners", data);
}

export function updateBanner(id: string, data: {
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
  buttonTextEn?: string;
  buttonTextAr?: string;
  imageUrl?: string;
  publicId?: string;
  linkUrl?: string;
  position?: number;
  isActive?: boolean;
}) {
  return api.put<ApiResponse<Banner>>(`/api/banners/${id}`, data);
}

export function deleteBanner(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/banners/${id}`);
}

export function reorderBanners(ids: string[]) {
  return api.post<ApiResponse<{ message: string }>>("/api/banners/reorder", { ids });
}
