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
