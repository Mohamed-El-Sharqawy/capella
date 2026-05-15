import { api } from "@/lib/api";
import type { Order } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export function updateOrderStatus(id: string, status: OrderStatus) {
  return api.put<ApiResponse<Order>>(`/api/orders/${id}/status`, { status });
}

export function updateOrderPaymentStatus(id: string, paid: boolean) {
  return api.put<ApiResponse<Order>>(`/api/orders/${id}/payment`, { paid });
}

export function deleteOrder(id: string) {
  return api.delete<ApiResponse<{ message: string }>>(`/api/orders/${id}`);
}

export function bulkDeleteOrders(ids: string[]) {
  return api.post<ApiResponse<{ deletedCount: number }>>("/api/orders/bulk-delete", { ids });
}
