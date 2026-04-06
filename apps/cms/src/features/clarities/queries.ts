import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface Clarity {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchClarities() {
  return api.get<ApiResponse<Clarity[]>>("/api/clarities");
}
