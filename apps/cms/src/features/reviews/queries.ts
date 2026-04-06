import { api } from "@/lib/api";

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  customerName: string;
  title: string;
  content: string;
  rating: number;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    nameEn: string;
    nameAr: string;
    slug: string;
    variants?: Array<{
      images?: Array<{
        image?: { url: string };
      }>;
    }>;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function fetchReviews(): Promise<Review[]> {
  return api.get<Review[]>("/api/reviews");
}

export function fetchReview(id: string) {
  return api.get<Review>(`/api/reviews/${id}`);
}
