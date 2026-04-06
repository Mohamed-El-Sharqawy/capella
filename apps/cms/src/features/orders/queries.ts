import { api } from "@/lib/api";
import type { Order } from "@ecommerce/shared-types";
import type { PaginatedResponse, ApiResponse } from "@ecommerce/shared-types";

export function fetchOrders(params?: Record<string, string>) {
  return api.get<ApiResponse<PaginatedResponse<Order>>>("/api/orders", params);
}

export function fetchOrder(id: string) {
  return api.get<ApiResponse<Order>>(`/api/orders/${id}`);
}
