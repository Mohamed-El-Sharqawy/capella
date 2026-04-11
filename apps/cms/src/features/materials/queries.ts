import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface Material {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchMaterials() {
  return api.get<ApiResponse<Material[]>>("/api/materials");
}
