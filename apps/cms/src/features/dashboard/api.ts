import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "./queries";

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: fetchDashboardStats,
  });
}
