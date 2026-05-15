import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { DashboardService } from "./service";

export const dashboardController = new Elysia({ prefix: "/dashboard" })
  .use(authPlugin)
  .get(
    "/stats",
    async ({ query }) => {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;
      const stats = await DashboardService.getStats(startDate, endDate);
      return { success: true as const, data: stats };
    },
    {
      isAdmin: true,
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    }
  );
