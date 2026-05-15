import { api } from "@/lib/api";

export interface PaymentMethodStat {
  method: string;
  orderCount: number;
  revenue: number;
  orderPercentage: number;
  revenuePercentage: number;
}

export interface OrderStatusStat {
  status: string;
  count: number;
  revenue: number;
}

export interface TrendPoint {
  date: string;
  revenue?: number;
  count?: number;
}

export interface TopCollection {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  imageUrl: string | null;
  totalQuantity: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  imageUrl: string | null;
  sales: number;
  revenue: number;
}

export interface TopSearchTerm {
  query: string;
  count: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  totalCustomers: number;
  customersChange: number;
  thisMonthRevenue: number;
  thisMonthOrders: number;
  avgOrdersPerDay: number;
  thisMonthNewCustomers: number;
  returningCustomers: number;
  recentOrders: any[];
  paymentMethods: PaymentMethodStat[];
  orderStatusCounts: OrderStatusStat[];
  revenueTrend: TrendPoint[];
  ordersTrend: TrendPoint[];
  topCollections: TopCollection[];
  topProducts: TopProduct[];
  topSearchTerms: TopSearchTerm[];
}

export function fetchDashboardStats() {
  return api.get<{ success: boolean; data: DashboardStats }>("/api/dashboard/stats");
}
