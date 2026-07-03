import { Package, ShoppingCart, DollarSign, Loader2, TrendingUp, TrendingDown, ArrowRight, CreditCard, Banknote, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/features/dashboard";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const PAYMENT_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) {
    return <span className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="h-3 w-3" />+{value.toFixed(1)}%</span>;
  }
  if (value < 0) {
    return <span className="flex items-center gap-1 text-xs text-red-600"><TrendingDown className="h-3 w-3" />{value.toFixed(1)}%</span>;
  }
  return <span className="text-xs text-muted-foreground">0%</span>;
}

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();
  const s = data?.data;

  if (isLoading) {
    return <div className="mt-8 flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return <div className="mt-8 rounded-lg border bg-red-50 p-6 text-center text-sm text-red-600">Failed to load dashboard data. Please make sure the backend is running.</div>;
  }

  if (!s) return null;

  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-muted-foreground">{monthName}</p>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ShoppingCart} label="Orders" value={s.thisMonthOrders.toString()} subtitle={`Average: ${s.avgOrdersPerDay} per day`} change={s.ordersChange} />
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(s.thisMonthRevenue)} subtitle="This month revenue" change={s.revenueChange} />
        <StatCard icon={UserPlus} label="New Customers" value={s.thisMonthNewCustomers.toString()} subtitle={`Returning: ${s.returningCustomers}`} change={s.customersChange} />
        <StatCard icon={Package} label="Top Product" value={s.topProducts[0]?.productName || "N/A"} subtitle={s.topProducts[0] ? `${s.topProducts[0].sales} sales` : "Most popular item"} change={0} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Revenue Trend</h2>
          <p className="text-xs text-muted-foreground mb-4">Revenue over the last 30 days</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={s.revenueTrend.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label: string) => `Date: ${label}`} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Orders Over Time</h2>
          <p className="text-xs text-muted-foreground mb-4">Order trend for the last 30 days</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={s.ordersTrend.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Collections + Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Selling Collections</h2>
          {s.topCollections.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No collection data available.</p>
          ) : (
            <div className="space-y-3">
              {s.topCollections.map((col, i) => (
                <div key={col.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                  {col.imageUrl && <img src={col.imageUrl} alt={col.nameEn} className="h-10 w-10 rounded-md object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{col.nameEn}</p>
                    <p className="text-xs text-muted-foreground">{col.totalQuantity} items sold &middot; {col.orderCount} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top Selling Products</h2>
            <Link to="/products" className="flex items-center gap-1 text-sm text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {s.topProducts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No product data available.</p>
          ) : (
            <div className="space-y-3">
              {s.topProducts.slice(0, 5).map((p, i) => (
                <div key={p.productId} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.productName} className="h-10 w-10 rounded-md object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods + Order Status + Search Terms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
          {s.paymentMethods.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No payment data.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={s.paymentMethods} dataKey="orderCount" nameKey="method" cx="50%" cy="50%" outerRadius={70} label={({ orderPercentage }: { orderPercentage: number }) => `${orderPercentage}%`}>
                    {s.paymentMethods.map((_, i) => <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} orders`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {s.paymentMethods.map((pm, i) => (
                  <div key={pm.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }} />
                      <span className="font-medium">{pm.method}</span>
                    </div>
                    <div className="text-right">
                      <span>{pm.orderCount} orders</span>
                      <span className="text-muted-foreground ml-2">({pm.orderPercentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Order Status</h2>
          <div className="space-y-3">
            {s.orderStatusCounts.map((os) => (
              <div key={os.status} className="flex items-center justify-between">
                <Badge className={`${STATUS_COLORS[os.status] || "bg-gray-100"} border-0`}>{os.status}</Badge>
                <div className="text-right">
                  <span className="font-medium">{os.count}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(os.revenue)})</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link to="/orders" className="flex items-center gap-1 text-sm text-primary hover:underline">View all orders <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Search Terms</h2>
          {s.topSearchTerms.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No search data available.</p>
          ) : (
            <div className="space-y-3">
              {s.topSearchTerms.map((st, i) => (
                <div key={st.query} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">"{st.query}"</p>
                  </div>
                  <Badge variant="secondary">{st.count} searches</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/orders" className="flex items-center gap-1 text-sm text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {s.recentOrders.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {s.recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-muted-foreground">{order.id.slice(0, 8)}...</span>
                    <Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border-0 text-xs`}>{order.status}</Badge>
                  </div>
                  <p className="text-sm font-medium mt-0.5 truncate">
                    {order.user ? `${order.user.firstName} ${order.user.lastName}` : `${order.guestFirstName || order.shippingFirstName} ${order.guestLastName || order.shippingLastName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">{formatCurrency(order.total)}</p>
                  <div className="mt-0.5">
                    {order.paymentMethod === "ZIINA" || order.paymentMethod === "TABBY" || order.paymentMethod === "TAMARA" ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-xs"><CreditCard className="h-2.5 w-2.5" /> {order.paymentMethod}</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs"><Banknote className="h-2.5 w-2.5" /> COD</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, change }: { icon: any; label: string; value: string; subtitle: string; change: number }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold truncate">{value}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{subtitle}</span>
        {change !== 0 && <ChangeIndicator value={change} />}
      </div>
    </div>
  );
}
