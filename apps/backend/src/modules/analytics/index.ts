import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { analyticsService } from "./service";

export const analyticsController = new Elysia({ prefix: "/analytics" })
  .use(authPlugin)
  // Get recent events (admin only)
  .get(
    "/events",
    async ({ query }) => {
      const result = await analyticsService.getRecentEvents({
        limit: query.limit ? Number(query.limit) : 50,
        offset: query.offset ? Number(query.offset) : 0,
        type: query.type,
        userId: query.userId,
        productId: query.productId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });
      return { success: true as const, data: result };
    },
    {
      isSignIn: true,
      role: ["ADMIN", "EDITOR"],
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        type: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        productId: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    }
  )
  // Get event stats (admin only)
  .get(
    "/stats",
    async ({ query }) => {
      const result = await analyticsService.getEventStats({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });
      return { success: true as const, data: result };
    },
    {
      isSignIn: true,
      role: ["ADMIN", "EDITOR"],
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    }
  )
  // Get real-time stats (admin only)
  .get(
    "/realtime",
    async () => {
      const result = await analyticsService.getRealTimeStats();
      return { success: true as const, data: result };
    },
    {
      isSignIn: true,
      role: ["ADMIN", "EDITOR"],
    }
  )
  // Get product analytics (admin only)
  .get(
    "/products/:productId",
    async ({ params, query }) => {
      const days = query.days ? Number(query.days) : 30;
      const result = await analyticsService.getProductAnalytics(params.productId, days);
      return { success: true as const, data: result };
    },
    {
      isSignIn: true,
      role: ["ADMIN", "EDITOR"],
      query: t.Object({
        days: t.Optional(t.String()),
      }),
    }
  )
  // Track product view (public endpoint)
  .post(
    "/track/product-view",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "product.view",
        productId: body.productId,
        sessionId,
        data: { productSlug: body.productSlug },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        productId: t.String(),
        productSlug: t.Optional(t.String()),
      }),
    }
  )
  // Track collection view (public endpoint)
  .post(
    "/track/collection-view",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "collection.view",
        collectionId: body.collectionId,
        sessionId,
        data: { collectionSlug: body.collectionSlug },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        collectionId: t.String(),
        collectionSlug: t.Optional(t.String()),
      }),
    }
  )
  // Track search (public endpoint)
  .post(
    "/track/search",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "search.query",
        sessionId,
        data: { query: body.query, resultsCount: body.resultsCount },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        query: t.String(),
        resultsCount: t.Number(),
      }),
    }
  )
  // Track quick add to cart (public endpoint)
  .post(
    "/track/cart-add",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "cart.add",
        sessionId,
        productId: body.productId,
        data: { variantId: body.variantId, source: body.source },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        productId: t.String(),
        variantId: t.String(),
        source: t.Optional(t.String()),
      }),
    }
  )
  // Track cart remove (public endpoint)
  .post(
    "/track/cart-remove",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "cart.remove",
        sessionId,
        productId: body.productId,
        data: { variantId: body.variantId },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        productId: t.String(),
        variantId: t.String(),
      }),
    }
  )
  // Track favourite add (public endpoint)
  .post(
    "/track/favourite-add",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "favourite.add",
        sessionId,
        productId: body.productId,
        data: { productId: body.productId },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        productId: t.String(),
      }),
    }
  )
  // Track favourite remove (public endpoint)
  .post(
    "/track/favourite-remove",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "favourite.remove",
        sessionId,
        productId: body.productId,
        data: { productId: body.productId },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        productId: t.String(),
      }),
    }
  )
  // Track wishlist add (public endpoint)
  .post(
    "/track/wishlist-add",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "wishlist.add",
        sessionId,
        productId: body.productId,
        data: { productId: body.productId },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        productId: t.String(),
      }),
    }
  )
  // Track wishlist remove (public endpoint)
  .post(
    "/track/wishlist-remove",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "wishlist.remove",
        sessionId,
        productId: body.productId,
        data: { productId: body.productId },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        productId: t.String(),
      }),
    }
  )
  // Track checkout view (public endpoint)
  .post(
    "/track/checkout-view",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "checkout.view",
        sessionId,
        data: { cartItemCount: body.cartItemCount, cartTotal: body.cartTotal },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        cartItemCount: t.Number(),
        cartTotal: t.Number(),
      }),
    }
  )
  // Track checkout step (public endpoint)
  .post(
    "/track/checkout-step",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "checkout.step",
        sessionId,
        data: body,
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        step: t.String(),
      }),
    }
  )
  // Track checkout abandon (public endpoint)
  .post(
    "/track/checkout-abandon",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.track({
        type: "checkout.abandon",
        sessionId,
        data: { step: body.step, cartItemCount: body.cartItemCount, cartTotal: body.cartTotal },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        step: t.String(),
        cartItemCount: t.Number(),
        cartTotal: t.Number(),
      }),
    }
  )
  // Track order complete (public endpoint)
  .post(
    "/track/order-complete",
    async ({ body, headers }) => {
      const sessionId = headers["x-session-id"] as string | undefined;
      await analyticsService.trackImmediate({
        type: "order.complete",
        sessionId,
        orderId: body.orderId,
        data: { orderId: body.orderId, total: body.total, itemCount: body.itemCount },
      });
      return { success: true as const };
    },
    {
      body: t.Object({
        orderId: t.String(),
        total: t.Number(),
        itemCount: t.Number(),
      }),
    }
  );
