import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface Size {
  id: string;
  nameEn: string;
  nameAr: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export function fetchSizes() {
  return api.get<ApiResponse<Size[]>>("/api/sizes");
}
