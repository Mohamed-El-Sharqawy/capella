import { prisma } from "../../lib/prisma";

// Analytics Event Types
export type AnalyticsEventType =
  | "cart.add"
  | "cart.remove"
  | "cart.update"
  | "cart.clear"
  | "favourite.add"
  | "favourite.remove"
  | "wishlist.add"
  | "wishlist.remove"
  | "wishlist.update"
  | "product.view"
  | "collection.view"
  | "search.query"
  | "checkout.view"
  | "checkout.step"
  | "checkout.abandon"
  | "order.create"
  | "order.complete"
  | "order.update"
  | "auth.login"
  | "auth.register"
  | "auth.logout";

export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  data?: Record<string, any>;
  productId?: string;
  collectionId?: string;
  orderId?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
}

// Batch processing for high-volume events
class AnalyticsService {
  private eventBuffer: AnalyticsEventInput[] = [];
  private readonly batchSize = 50;
  private readonly flushInterval = 5000; // 5 seconds

  constructor() {
    this.startFlushTimer();
  }

  private startFlushTimer() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Queue event for batch insert
  async track(event: AnalyticsEventInput) {
    this.eventBuffer.push(event);

    // Console log for debugging
    this.logToConsole(event);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  // Immediate insert (for critical events like orders)
  async trackImmediate(event: AnalyticsEventInput) {
    this.logToConsole(event);
    
    await prisma.analyticsEvent.create({
      data: {
        type: event.type,
        userId: event.userId,
        sessionId: event.sessionId,
        data: event.data || {},
        productId: event.productId,
        collectionId: event.collectionId,
        orderId: event.orderId,
        ip: event.ip,
        userAgent: event.userAgent,
        referer: event.referer,
      },
    });
  }

  // Batch insert buffered events
  async flush() {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await prisma.analyticsEvent.createMany({
        data: events.map((e) => ({
          type: e.type,
          userId: e.userId,
          sessionId: e.sessionId,
          data: e.data || {},
          productId: e.productId,
          collectionId: e.collectionId,
          orderId: e.orderId,
          ip: e.ip,
          userAgent: e.userAgent,
          referer: e.referer,
        })),
      });
    } catch (error) {
      console.error("Failed to flush analytics events:", error);
      // Re-add events to buffer on failure
      this.eventBuffer.unshift(...events);
    }
  }

  private logToConsole(event: AnalyticsEventInput) {
    const colors = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      dim: "\x1b[2m",
      blue: "\x1b[34m",
      red: "\x1b[31m",
      magenta: "\x1b[35m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      cyan: "\x1b[36m",
    };

    const eventColors: Record<string, string> = {
      cart: colors.blue,
      favourite: colors.red,
      wishlist: colors.magenta,
      product: colors.green,
      collection: colors.green,
      order: colors.yellow,
      auth: colors.cyan,
      search: colors.cyan,
    };

    const eventIcons: Record<string, string> = {
      cart: "🛒",
      favourite: "❤️",
      wishlist: "📋",
      product: "📦",
      collection: "📁",
      order: "🧾",
      auth: "🔐",
      search: "🔍",
    };

    const category = event.type.split(".")[0];
    const color = eventColors[category] || colors.cyan;
    const icon = eventIcons[category] || "📊";
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
        `${color}${colors.bright}${icon} ${event.type}${colors.reset} ` +
        `${event.userId ? `${colors.cyan}user:${event.userId.substring(0, 8)}...${colors.reset} ` : ""}` +
        `${colors.dim}${JSON.stringify(event.data || {})}${colors.reset}`
    );
  }

  // Query methods for CMS dashboard
  async getRecentEvents(options: {
    limit?: number;
    offset?: number;
    type?: string;
    userId?: string;
    productId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { limit = 50, offset = 0, type, userId, productId, startDate, endDate } = options;

    const where: any = {};
    if (type) where.type = { startsWith: type };
    if (userId) where.userId = userId;
    if (productId) where.productId = productId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [rawEvents, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.analyticsEvent.count({ where }),
    ]);

    // Fetch product and collection details for events
    const productIds = [...new Set(rawEvents.filter(e => e.productId).map(e => e.productId!))];
    
    // Get collection IDs from both the event's collectionId field and from data.collectionId
    const collectionIds = [...new Set(
      rawEvents
        .map(e => {
          // First check direct collectionId field
          if (e.collectionId) return e.collectionId;
          // Then check data.collectionId
          if (e.data && typeof e.data === 'object' && 'collectionId' in (e.data as any)) {
            return (e.data as any).collectionId;
          }
          return null;
        })
        .filter(Boolean) as string[]
    )];

    // Also get collection slugs from data for lookup
    const collectionSlugs = [...new Set(
      rawEvents
        .map(e => {
          if (e.data && typeof e.data === 'object' && 'collectionSlug' in (e.data as any)) {
            return (e.data as any).collectionSlug;
          }
          return null;
        })
        .filter(Boolean) as string[]
    )];

    const [products, collectionsById, collectionsBySlug] = await Promise.all([
      productIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, nameEn: true, nameAr: true, slug: true },
          })
        : [],
      collectionIds.length > 0
        ? prisma.collection.findMany({
            where: { id: { in: collectionIds } },
            select: { id: true, nameEn: true, nameAr: true, slug: true },
          })
        : [],
      collectionSlugs.length > 0
        ? prisma.collection.findMany({
            where: { slug: { in: collectionSlugs } },
            select: { id: true, nameEn: true, nameAr: true, slug: true },
          })
        : [],
    ]);

    // Merge collections from both lookups (dedupe by id)
    const allCollections = [...collectionsById, ...collectionsBySlug];
    const uniqueCollections = Array.from(new Map(allCollections.map(c => [c.id, c])).values());

    const productMap = new Map(products.map(p => [p.id, p]));
    const collectionMapById = new Map(uniqueCollections.map(c => [c.id, c]));
    const collectionMapBySlug = new Map(uniqueCollections.map(c => [c.slug, c]));

    // Enrich events with product/collection details
    const events = rawEvents.map(event => {
      // Get collection from ID field, data.collectionId, or data.collectionSlug
      let collection = null;
      if (event.collectionId) {
        collection = collectionMapById.get(event.collectionId) || collectionMapBySlug.get(event.collectionId) || null;
      } else if (event.data && typeof event.data === 'object') {
        const data = event.data as any;
        if (data.collectionId) {
          collection = collectionMapById.get(data.collectionId) || collectionMapBySlug.get(data.collectionId) || null;
        } else if (data.collectionSlug) {
          collection = collectionMapBySlug.get(data.collectionSlug) || null;
        }
      }
      
      return {
        ...event,
        product: event.productId ? productMap.get(event.productId) || null : null,
        collection,
      };
    });

    return { events, total, limit, offset };
  }

  // Aggregated stats for dashboard
  async getEventStats(options: { startDate?: Date; endDate?: Date; groupBy?: "day" | "hour" }) {
    const { startDate, endDate } = options;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get counts by event type
    const typeCounts = await prisma.analyticsEvent.groupBy({
      by: ["type"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Get unique users
    const uniqueUsers = await prisma.analyticsEvent.findMany({
      where: { ...where, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    });

    // Get top products
    const topProducts = await prisma.analyticsEvent.groupBy({
      by: ["productId"],
      where: { ...where, productId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    return {
      typeCounts: typeCounts.map((t: { type: string; _count: { id: number } }) => ({ type: t.type, count: t._count.id })),
      uniqueUsersCount: uniqueUsers.length,
      topProducts,
      totalEvents: typeCounts.reduce((sum: number, t: { _count: { id: number } }) => sum + t._count.id, 0),
    };
  }

  // Real-time stats (last 24 hours)
  async getRealTimeStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const [last24hStats, lastHourStats, recentEvents] = await Promise.all([
      this.getEventStats({ startDate: last24h }),
      this.getEventStats({ startDate: lastHour }),
      this.getRecentEvents({ limit: 20 }),
    ]);

    return {
      last24h: last24hStats,
      lastHour: lastHourStats,
      recentEvents: recentEvents.events,
    };
  }

  // Product analytics
  async getProductAnalytics(productId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await prisma.analyticsEvent.groupBy({
      by: ["type"],
      where: {
        productId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    return {
      productId,
      period: `${days} days`,
      views: events.find((e: { type: string; _count: { id: number } }) => e.type === "product.view")?._count.id || 0,
      addToCart: events.find((e: { type: string; _count: { id: number } }) => e.type === "cart.add")?._count.id || 0,
      addToFavourites: events.find((e: { type: string; _count: { id: number } }) => e.type === "favourite.add")?._count.id || 0,
      addToWishlist: events.find((e: { type: string; _count: { id: number } }) => e.type === "wishlist.add")?._count.id || 0,
    };
  }

  // Cleanup old events (run periodically)
  async cleanupOldEvents(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    return { deleted: result.count };
  }
}

// Export singleton
export const analyticsService = new AnalyticsService();

// Helper functions for common events
export const trackCartAdd = (userId: string, data: { productId?: string; variantId: string; quantity: number }) => {
  analyticsService.track({ type: "cart.add", userId, productId: data.productId, data });
};

export const trackCartRemove = (userId: string, data: { productId?: string; variantId?: string; itemId?: string }) => {
  analyticsService.track({ type: "cart.remove", userId, productId: data.productId, data });
};

export const trackCartUpdate = (userId: string, data: { productId?: string; itemId?: string; quantity: number }) => {
  analyticsService.track({ type: "cart.update", userId, productId: data.productId, data });
};

export const trackCartClear = (userId: string) => {
  analyticsService.track({ type: "cart.clear", userId, data: {} });
};

export const trackFavouriteAdd = (userId: string, productId: string) => {
  analyticsService.track({ type: "favourite.add", userId, productId, data: { productId } });
};

export const trackFavouriteRemove = (userId: string, productId: string) => {
  analyticsService.track({ type: "favourite.remove", userId, productId, data: { productId } });
};

export const trackWishlistAdd = (userId: string, productId: string, notes?: string) => {
  analyticsService.track({ type: "wishlist.add", userId, productId, data: { productId, notes } });
};

export const trackWishlistRemove = (userId: string, productId: string) => {
  analyticsService.track({ type: "wishlist.remove", userId, productId, data: { productId } });
};

export const trackProductView = (productId: string, userId?: string, sessionId?: string) => {
  analyticsService.track({ type: "product.view", userId, sessionId, productId, data: { productId } });
};

export const trackCollectionView = (collectionId: string, userId?: string, sessionId?: string) => {
  analyticsService.track({ type: "collection.view", userId, sessionId, collectionId, data: { collectionId } });
};

export const trackSearch = (query: string, resultsCount: number, userId?: string) => {
  analyticsService.track({ type: "search.query", userId, data: { query, resultsCount } });
};

export const trackOrderCreate = (userId: string, orderId: string, total: number, itemCount: number) => {
  analyticsService.trackImmediate({ type: "order.create", userId, orderId, data: { orderId, total, itemCount } });
};

export const trackAuthLogin = (userId: string, method: string) => {
  analyticsService.track({ type: "auth.login", userId, data: { method } });
};

export const trackAuthRegister = (userId: string, method: string) => {
  analyticsService.track({ type: "auth.register", userId, data: { method } });
};
