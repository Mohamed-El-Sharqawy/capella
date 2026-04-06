import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";
import type { Stone } from "./queries";

export interface CreateStoneBody {
  nameEn: string;
  nameAr: string;
}

export type UpdateStoneBody = Partial<CreateStoneBody>;

export function createStone(body: CreateStoneBody) {
  return api.post<ApiResponse<Stone>>("/api/stones", body);
}

export function updateStone(id: string, body: UpdateStoneBody) {
  return api.put<ApiResponse<Stone>>(`/api/stones/${id}`, body);
}

export function deleteStone(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/stones/${id}`);
}
