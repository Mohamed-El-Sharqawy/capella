import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "$0.00", icon: DollarSign, change: "+0%" },
  { label: "Orders", value: "0", icon: ShoppingCart, change: "+0%" },
  { label: "Products", value: "0", icon: Package, change: "+0%" },
  { label: "Customers", value: "0", icon: Users, change: "+0%" },
];

export function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Overview of your e-commerce platform.
      </p>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <p className="mt-4 text-center text-sm text-muted-foreground py-8">
          No recent orders. Connect the backend API to see live data.
        </p>
      </div>
    </div>
  );
}
