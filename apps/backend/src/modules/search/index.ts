import { Elysia, t, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { SearchService } from "./service";
import { SearchModel } from "./model";

export const searchController = new Elysia({ prefix: "/search" })
  .use(authPlugin)
  // Main search endpoint
  .get("/", async ({ query }) => {
    const q = query.q?.trim();
    const limit = query.limit ? Number(query.limit) : 5;
    
    if (!q || q.length < 2) {
      return { products: [], collections: [] };
    }

    return SearchService.search(q, limit);
  }, {
    query: SearchModel.querySchema,
  })
  // Get trending products
  .get("/trending", async ({ query }) => {
    const limit = query.limit ? Number(query.limit) : 8;
    const products = await SearchService.getTrending(limit);
    return { success: true as const, data: products };
  }, {
    query: t.Object({ limit: t.Optional(t.String()) }),
  })
  // Track search query
  .post("/analytics/query", async ({ body, user, headers }) => {
    const sessionId = headers["x-session-id"] as string | undefined;
    const result = await SearchService.trackQuery(body, user?.id, sessionId);
    return { success: true as const, data: result };
  }, {
    optionalAuth: true,
    body: SearchModel.trackQueryBody,
  })
  // Track search result click
  .post("/analytics/click", async ({ body, user, headers }) => {
    const sessionId = headers["x-session-id"] as string | undefined;
    const result = await SearchService.trackClick(body, user?.id, sessionId);
    return { success: true as const, data: result };
  }, {
    optionalAuth: true,
    body: SearchModel.trackClickBody,
  })
  // Admin analytics endpoint
  .get("/analytics/queries", async ({ query }) => {
    const analytics = await SearchService.getAnalytics(query);
    return { success: true as const, data: analytics };
  }, {
    isAdmin: true,
    query: SearchModel.analyticsQuery,
  });
