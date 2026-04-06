import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCoupons, fetchCoupon } from "./queries";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type CreateCouponBody,
  type UpdateCouponBody,
} from "./mutations";

export const couponKeys = {
  all: ["coupons"] as const,
  lists: () => [...couponKeys.all, "list"] as const,
  list: () => [...couponKeys.lists()] as const,
  details: () => [...couponKeys.all, "detail"] as const,
  detail: (id: string) => [...couponKeys.details(), id] as const,
};

export function useCoupons() {
  return useQuery({
    queryKey: couponKeys.list(),
    queryFn: fetchCoupons,
  });
}

export function useCoupon(id: string) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => fetchCoupon(id),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCouponBody) => createCoupon(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCouponBody }) =>
      updateCoupon(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}
