"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { apiGet } from "@/lib/api-client";
import type { Review } from "../types";

export function useProductReviews(productId: string) {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => {
      const token = getAccessToken();
      return apiGet<Review[]>(`/api/reviews/product/${productId}`, { token: token || undefined });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const invalidateReviews = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  return {
    reviews,
    isLoading,
    averageRating,
    reviewCount: reviews.length,
    invalidateReviews,
  };
}
