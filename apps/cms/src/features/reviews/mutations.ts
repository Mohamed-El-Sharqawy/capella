import { api } from "@/lib/api";
import type { Review } from "./queries";

export interface UpdateReviewData {
  title?: string;
  content?: string;
  rating?: number;
  isApproved?: boolean;
  isActive?: boolean;
}

export function updateReview(id: string, data: UpdateReviewData) {
  return api.patch<Review>(`/api/reviews/${id}`, data);
}

export function approveReview(id: string) {
  return api.post<Review>(`/api/reviews/${id}/approve`);
}

export function deleteReview(id: string) {
  return api.delete<{ success: boolean }>(`/api/reviews/${id}`);
}
