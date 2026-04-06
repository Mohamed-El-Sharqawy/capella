import { api } from "@/lib/api";
import type { Coupon } from "@ecommerce/shared-types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function fetchCoupons() {
  return api.get<ApiResponse<Coupon[]>>("/api/coupons");
}

export function fetchCoupon(id: string) {
  return api.get<ApiResponse<Coupon>>(`/api/coupons/${id}`);
}
