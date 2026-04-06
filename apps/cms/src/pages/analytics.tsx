import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Heart,
  Bookmark,
  Eye,
  Search,
  Package,
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
  Filter,
  Calendar,
  ExternalLink,
  User,
  Clock,
  Hash,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventStats {
  typeCounts: { type: string; count: number }[];
  uniqueUsersCount: number;
  topProducts: { productId: string; _count: { id: number } }[];
  totalEvents: number;
}

interface RealtimeStats {
  last24h: EventStats;
  lastHour: EventStats;
  recentEvents: AnalyticsEvent[];
}

interface ProductInfo {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
}

interface CollectionInfo {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
}

interface AnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
  productId?: string;
  collectionId?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  product?: ProductInfo | null;
  collection?: CollectionInfo | null;
}

const EVENT_ICONS: Record<string, typeof ShoppingCart> = {
  cart: ShoppingCart,
  favourite: Heart,
  wishlist: Bookmark,
  product: Eye,
  collection: Package,
  search: Search,
  order: TrendingUp,
  auth: Users,
};

const EVENT_COLORS: Record<string, string> = {
  cart: "bg-blue-500",
  favourite: "bg-red-500",
  wishlist: "bg-purple-500",
  product: "bg-green-500",
  collection: "bg-emerald-500",
  search: "bg-cyan-500",
  order: "bg-yellow-500",
  auth: "bg-indigo-500",
};

const TIME_RANGES = [
  { value: "1h", label: "Last Hour" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

function getEventCategory(type: string): string {
  return type.split(".")[0];
}

function formatEventType(type: string): string {
  return type
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" → ");
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("24h");
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);

  // Fetch realtime stats
  const {
    data: realtimeData,
    isLoading: isLoadingRealtime,
    refetch: refetchRealtime,
  } = useQuery({
    queryKey: ["analytics", "realtime"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: RealtimeStats }>("/api/analytics/realtime");
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch events list
  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["analytics", "events", eventFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (eventFilter) params.set("type", eventFilter);
      const res = await api.get<{ success: boolean; data: { events: AnalyticsEvent[]; total: number } }>(`/api/analytics/events?${params}`);
      return res.data;
    },
  });

  const stats = realtimeData?.last24h;
  const recentEvents = eventsData?.events || realtimeData?.recentEvents || [];

  // Calculate summary stats
  const cartEvents = stats?.typeCounts.filter((t) => t.type.startsWith("cart")).reduce((sum, t) => sum + t.count, 0) || 0;
  const viewEvents = stats?.typeCounts.find((t) => t.type === "product.view")?.count || 0;
  const favouriteEvents = stats?.typeCounts.filter((t) => t.type.startsWith("favourite")).reduce((sum, t) => sum + t.count, 0) || 0;
  const searchEvents = stats?.typeCounts.find((t) => t.type === "search.query")?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Real-time user activity and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              refetchRealtime();
              refetchEvents();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Product Views"
          value={viewEvents}
          icon={Eye}
          color="bg-green-500"
          change={realtimeData?.lastHour.typeCounts.find((t) => t.type === "product.view")?.count || 0}
          changeLabel="last hour"
        />
        <StatCard
          title="Cart Actions"
          value={cartEvents}
          icon={ShoppingCart}
          color="bg-blue-500"
          change={realtimeData?.lastHour.typeCounts.filter((t) => t.type.startsWith("cart")).reduce((sum, t) => sum + t.count, 0) || 0}
          changeLabel="last hour"
        />
        <StatCard
          title="Favourites"
          value={favouriteEvents}
          icon={Heart}
          color="bg-red-500"
          change={realtimeData?.lastHour.typeCounts.filter((t) => t.type.startsWith("favourite")).reduce((sum, t) => sum + t.count, 0) || 0}
          changeLabel="last hour"
        />
        <StatCard
          title="Searches"
          value={searchEvents}
          icon={Search}
          color="bg-cyan-500"
          change={realtimeData?.lastHour.typeCounts.find((t) => t.type === "search.query")?.count || 0}
          changeLabel="last hour"
        />
      </div>

      {/* Event Type Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Event Types Chart */}
        <div className="lg:col-span-1 rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Events by Type</h2>
          {isLoadingRealtime ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.typeCounts.slice(0, 8).map((item) => {
                const category = getEventCategory(item.type);
                const percentage = stats.totalEvents > 0 ? (item.count / stats.totalEvents) * 100 : 0;
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{formatEventType(item.type)}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", EVENT_COLORS[category] || "bg-gray-500")}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!stats?.typeCounts || stats.typeCounts.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No events recorded yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold">Live Activity</h2>
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <Select
              value={eventFilter || "all"}
              onValueChange={(v) => setEventFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="cart">Cart</SelectItem>
                <SelectItem value="favourite">Favourites</SelectItem>
                <SelectItem value="wishlist">Wishlist</SelectItem>
                <SelectItem value="product">Product Views</SelectItem>
                <SelectItem value="search">Searches</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentEvents.map((event) => {
                const category = getEventCategory(event.type);
                const Icon = EVENT_ICONS[category] || Activity;
                const color = EVENT_COLORS[category] || "bg-gray-500";

                // Get user display name
                const userDisplay = event.user
                  ? `${event.user.firstName} ${event.user.lastName}`
                  : event.sessionId
                  ? "Guest"
                  : "Unknown";

                // Get product/collection name
                const productName = event.product?.nameEn;
                const collectionName = event.collection?.nameEn;

                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className={cn("p-2 rounded-full text-white", color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {formatEventType(event.type)}
                        </span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          event.user ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {userDisplay}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {productName && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                            📦 {productName}
                          </span>
                        )}
                        {collectionName && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                            📁 {collectionName}
                          </span>
                        )}
                        {event.data?.query && (
                          <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                            🔍 "{event.data.query}"
                          </span>
                        )}
                        {event.data?.variantId && !productName && (
                          <span className="text-xs text-muted-foreground truncate">
                            Variant: {event.data.variantId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(event.createdAt)}
                    </span>
                  </div>
                );
              })}
              {recentEvents.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No recent activity
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Unique Users (24h)</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats?.uniqueUsersCount || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Total Events (24h)</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats?.totalEvents || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Events/Hour (avg)</span>
          </div>
          <p className="mt-2 text-3xl font-bold">
            {stats?.totalEvents ? Math.round(stats.totalEvents / 24) : 0}
          </p>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          open={true}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  change,
  changeLabel,
}: {
  title: string;
  value: number;
  icon: typeof ShoppingCart;
  color: string;
  change: number;
  changeLabel: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("p-2 rounded-full text-white", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        +{change} {changeLabel}
      </p>
    </div>
  );
}

// Event Detail Modal Component
function EventDetailModal({
  event,
  open,
  onClose,
}: {
  event: AnalyticsEvent;
  open: boolean;
  onClose: () => void;
}) {
  const category = getEventCategory(event.type);
  const Icon = EVENT_ICONS[category] || Activity;
  const color = EVENT_COLORS[category] || "bg-gray-500";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full text-white", color)}>
              <Icon className="h-4 w-4" />
            </div>
            {formatEventType(event.type)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(event.createdAt).toLocaleString()}</span>
          </div>

          {/* User Info */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">User</span>
            </div>
            {event.user ? (
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {event.user.firstName} {event.user.lastName}</p>
                <p><span className="text-muted-foreground">Email:</span> {event.user.email}</p>
                <p><span className="text-muted-foreground">ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{event.user.id}</code></p>
              </div>
            ) : (
              <div className="text-sm">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">Guest</span>
                {event.sessionId && (
                  <p className="mt-2 text-muted-foreground text-xs">
                    Session: <code className="bg-muted px-1 py-0.5 rounded">{event.sessionId}</code>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          {event.product && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Product</span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name (EN):</span> {event.product.nameEn}</p>
                <p><span className="text-muted-foreground">Name (AR):</span> {event.product.nameAr}</p>
                <p><span className="text-muted-foreground">Slug:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{event.product.slug}</code></p>
                <a
                  href={`/products/${event.product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Product
                </a>
              </div>
            </div>
          )}

          {/* Collection Info */}
          {event.collection && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-sm">Collection</span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name (EN):</span> {event.collection.nameEn}</p>
                <p><span className="text-muted-foreground">Name (AR):</span> {event.collection.nameAr}</p>
                <p><span className="text-muted-foreground">Slug:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{event.collection.slug}</code></p>
                <a
                  href={`/collections/${event.collection.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Collection
                </a>
              </div>
            </div>
          )}

          {/* Event Data */}
          {event.data && Object.keys(event.data).length > 0 && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Event Data</span>
              </div>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Event ID */}
          <div className="text-xs text-muted-foreground">
            Event ID: <code className="bg-muted px-1 py-0.5 rounded">{event.id}</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
