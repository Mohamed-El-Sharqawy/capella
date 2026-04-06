import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";
import type { Material } from "./queries";

export interface CreateMaterialBody {
  nameEn: string;
  nameAr: string;
}

export type UpdateMaterialBody = Partial<CreateMaterialBody>;

export function createMaterial(body: CreateMaterialBody) {
  return api.post<ApiResponse<Material>>("/api/materials", body);
}

export function updateMaterial(id: string, body: UpdateMaterialBody) {
  return api.put<ApiResponse<Material>>(`/api/materials/${id}`, body);
}

export function deleteMaterial(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/materials/${id}`);
}
