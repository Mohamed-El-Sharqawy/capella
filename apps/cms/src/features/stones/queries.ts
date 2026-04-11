import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface Stone {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchStones() {
  return api.get<ApiResponse<Stone[]>>("/api/stones");
}
