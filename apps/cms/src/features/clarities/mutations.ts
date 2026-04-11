import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";
import type { Clarity } from "./queries";

export interface CreateClarityBody {
  nameEn: string;
  nameAr: string;
}

export type UpdateClarityBody = Partial<CreateClarityBody>;

export function createClarity(body: CreateClarityBody) {
  return api.post<ApiResponse<Clarity>>("/api/clarities", body);
}

export function updateClarity(id: string, body: UpdateClarityBody) {
  return api.put<ApiResponse<Clarity>>(`/api/clarities/${id}`, body);
}

export function deleteClarity(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/clarities/${id}`);
}
