import { api } from "@/lib/api";
import type { Color } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface CreateColorBody {
  nameEn: string;
  nameAr: string;
  hex: string;
}

export type UpdateColorBody = Partial<CreateColorBody>;

export function createColor(body: CreateColorBody) {
  return api.post<ApiResponse<Color>>("/api/colors", body);
}

export function updateColor(id: string, body: UpdateColorBody) {
  return api.put<ApiResponse<Color>>(`/api/colors/${id}`, body);
}

export function deleteColor(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/colors/${id}`);
}
