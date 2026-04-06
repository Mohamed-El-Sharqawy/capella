import { api } from "@/lib/api";
import type { Coupon, DiscountType } from "@ecommerce/shared-types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateCouponBody {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export type UpdateCouponBody = Partial<CreateCouponBody>;

export function createCoupon(body: CreateCouponBody) {
  return api.post<ApiResponse<Coupon>>("/api/coupons", body);
}

export function updateCoupon(id: string, body: UpdateCouponBody) {
  return api.put<ApiResponse<Coupon>>(`/api/coupons/${id}`, body);
}

export function deleteCoupon(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/coupons/${id}`);
}
