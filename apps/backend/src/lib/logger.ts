import { Elysia } from "elysia";

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

// HTTP method colors
const methodColors: Record<string, string> = {
  GET: colors.green,
  POST: colors.blue,
  PUT: colors.yellow,
  PATCH: colors.magenta,
  DELETE: colors.red,
};

// Status code colors
function getStatusColor(status: number): string {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.white;
}

// Format duration
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Get timestamp
function getTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

// Request/Response Logger Plugin
export const requestLogger = new Elysia({ name: "request-logger" })
  .onRequest(({ store }) => {
    (store as any).startTime = performance.now();
  })
  .onAfterResponse(({ request, store, set }) => {
    const startTime = (store as any).startTime || performance.now();
    const duration = performance.now() - startTime;
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    const status = set.status || 200;

    const methodColor = methodColors[method] || colors.white;
    const statusColor = getStatusColor(Number(status));

    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ` +
      `${methodColor}${colors.bright}${method.padEnd(7)}${colors.reset} ` +
      `${path} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.dim}${formatDuration(duration)}${colors.reset}`
    );
  })
  .onError(({ request, error, set }) => {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    const status = set.status || 500;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ` +
      `${colors.red}${colors.bright}${method.padEnd(7)}${colors.reset} ` +
      `${path} ` +
      `${colors.bgRed}${colors.white} ${status} ${colors.reset} ` +
      `${colors.red}${errorMessage}${colors.reset}`
    );
  });

// Analytics Event Types
export type AnalyticsEventType =
  // Cart events
  | "cart.add"
  | "cart.remove"
  | "cart.update"
  | "cart.clear"
  // Favourite events
  | "favourite.add"
  | "favourite.remove"
  // Wishlist events
  | "wishlist.add"
  | "wishlist.remove"
  | "wishlist.update"
  // View events
  | "product.view"
  | "collection.view"
  | "search.query"
  // Order events
  | "order.create"
  | "order.update"
  // Auth events
  | "auth.login"
  | "auth.register"
  | "auth.logout";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

// Analytics Logger
class AnalyticsLogger {
  private events: AnalyticsEvent[] = [];
  private readonly maxBufferSize = 100;

  log(event: Omit<AnalyticsEvent, "timestamp">) {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Console output with colors
    const eventColor = this.getEventColor(event.type);
    const icon = this.getEventIcon(event.type);
    
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ` +
      `${eventColor}${colors.bright}${icon} ${event.type}${colors.reset} ` +
      `${event.userId ? `${colors.cyan}user:${event.userId.substring(0, 8)}...${colors.reset} ` : ""}` +
      `${colors.dim}${JSON.stringify(event.data)}${colors.reset}`
    );

    // Buffer events (for future database storage or external analytics)
    this.events.push(fullEvent);
    if (this.events.length > this.maxBufferSize) {
      this.flush();
    }
  }

  private getEventColor(type: AnalyticsEventType): string {
    if (type.startsWith("cart")) return colors.blue;
    if (type.startsWith("favourite")) return colors.red;
    if (type.startsWith("wishlist")) return colors.magenta;
    if (type.startsWith("product") || type.startsWith("collection")) return colors.green;
    if (type.startsWith("order")) return colors.yellow;
    if (type.startsWith("auth")) return colors.cyan;
    if (type.startsWith("search")) return colors.white;
    return colors.white;
  }

  private getEventIcon(type: AnalyticsEventType): string {
    if (type.startsWith("cart")) return "🛒";
    if (type.startsWith("favourite")) return "❤️";
    if (type.startsWith("wishlist")) return "📋";
    if (type.startsWith("product")) return "📦";
    if (type.startsWith("collection")) return "📁";
    if (type.startsWith("order")) return "🧾";
    if (type.startsWith("auth")) return "🔐";
    if (type.startsWith("search")) return "🔍";
    return "📊";
  }

  // Flush events to storage (implement as needed)
  async flush() {
    if (this.events.length === 0) return;

    // TODO: Save to database or send to external analytics service
    // For now, just clear the buffer
    // await prisma.analyticsEvent.createMany({ data: this.events });
    
    this.events = [];
  }

  // Get buffered events (for debugging)
  getBufferedEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

// Export singleton instance
export const analytics = new AnalyticsLogger();

// Helper functions for common events
export const logCartAdd = (userId: string, data: { productId: string; variantId: string; quantity: number }) => {
  analytics.log({ type: "cart.add", userId, data });
};

export const logCartRemove = (userId: string, data: { productId?: string; variantId?: string; itemId?: string }) => {
  analytics.log({ type: "cart.remove", userId, data });
};

export const logCartUpdate = (userId: string, data: { itemId: string; quantity: number }) => {
  analytics.log({ type: "cart.update", userId, data });
};

export const logCartClear = (userId: string) => {
  analytics.log({ type: "cart.clear", userId, data: {} });
};

export const logFavouriteAdd = (userId: string, data: { productId: string }) => {
  analytics.log({ type: "favourite.add", userId, data });
};

export const logFavouriteRemove = (userId: string, data: { productId: string }) => {
  analytics.log({ type: "favourite.remove", userId, data });
};

export const logWishlistAdd = (userId: string, data: { productId: string; notes?: string }) => {
  analytics.log({ type: "wishlist.add", userId, data });
};

export const logWishlistRemove = (userId: string, data: { productId: string }) => {
  analytics.log({ type: "wishlist.remove", userId, data });
};

export const logWishlistUpdate = (userId: string, data: { productId: string; notes?: string }) => {
  analytics.log({ type: "wishlist.update", userId, data });
};

export const logProductView = (data: { productId: string; productSlug: string; userId?: string }) => {
  analytics.log({ type: "product.view", userId: data.userId, data });
};

export const logCollectionView = (data: { collectionId?: string; collectionSlug: string; userId?: string }) => {
  analytics.log({ type: "collection.view", userId: data.userId, data });
};

export const logSearchQuery = (data: { query: string; resultsCount: number; userId?: string }) => {
  analytics.log({ type: "search.query", userId: data.userId, data });
};

export const logOrderCreate = (userId: string, data: { orderId: string; total: number; itemCount: number }) => {
  analytics.log({ type: "order.create", userId, data });
};

export const logAuthLogin = (userId: string, data: { method: string }) => {
  analytics.log({ type: "auth.login", userId, data });
};

export const logAuthRegister = (userId: string, data: { method: string }) => {
  analytics.log({ type: "auth.register", userId, data });
};
