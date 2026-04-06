import { api } from "@/lib/api";
import type { Size } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface CreateSizeBody {
  nameEn: string;
  nameAr: string;
  position?: number;
}

export type UpdateSizeBody = Partial<CreateSizeBody>;

export function createSize(body: CreateSizeBody) {
  return api.post<ApiResponse<Size>>("/api/sizes", body);
}

export function updateSize(id: string, body: UpdateSizeBody) {
  return api.put<ApiResponse<Size>>(`/api/sizes/${id}`, body);
}

export function deleteSize(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/sizes/${id}`);
}
