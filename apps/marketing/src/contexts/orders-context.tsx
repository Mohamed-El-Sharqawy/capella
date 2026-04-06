"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import type { Order } from "@ecommerce/shared-types";
import { apiGet } from "@/lib/api-client";

interface OrdersContextType {
  orders: { data: Order[]; meta?: { total: number; page: number; limit: number; totalPages: number } };
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  getOrder: (orderId: string) => Promise<Order | null>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [orders, setOrders] = useState<{ data: Order[]; meta?: { total: number; page: number; limit: number; totalPages: number } }>({ data: [], meta: undefined });
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders({ data: [], meta: undefined });
      return;
    }

    setIsLoading(true);
    try {
      const token = getAccessToken();
      const response = await apiGet<{ data: { data: Order[]; meta?: { total: number; page: number; limit: number; totalPages: number } } }>("/api/orders", { token: token || undefined });
      // API returns nested structure: { data: { data: [...], meta: {...} } }
      setOrders(response.data);
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAccessToken]);

  const getOrder = useCallback(
    async (orderId: string): Promise<Order | null> => {
      if (!isAuthenticated) return null;

      try {
        const token = getAccessToken();
        const response = await apiGet<{ data: Order }>(`/api/orders/${orderId}`, { token: token || undefined });
        return response.data;
      } catch {
        console.error("Failed to fetch order");
      }
      return null;
    },
    [isAuthenticated, getAccessToken]
  );

  // Fetch orders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setOrders({ data: [], meta: undefined });
    }
  }, [isAuthenticated, fetchOrders]);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        isLoading,
        fetchOrders,
        getOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}
