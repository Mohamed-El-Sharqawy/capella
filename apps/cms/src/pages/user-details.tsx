import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  ShoppingCart,
  Activity,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  avatar?: string;
  createdAt: string;
  orders?: Array<{
    id: string;
    orderNumber?: string;
    status: string;
    total: number;
    createdAt: string;
    items: Array<{
      id: string;
      productNameEn: string;
      variantNameEn: string;
      quantity: number;
      price: number;
      imageUrl?: string;
    }>;
  }>;
  analyticsEvents?: Array<{
    id: string;
    type: string;
    createdAt: string;
    data?: Record<string, unknown>;
  }>;
  addresses?: Array<{
    id: string;
    label?: string;
    street: string;
    city: string;
    state: string;
    country: string;
  }>;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  EDITOR: "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-green-100 text-green-700",
  GUEST: "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: response, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      return api.get<{ success: boolean; data: UserDetail }>(`/api/users/${id}`);
    },
    enabled: !!id,
  });

  const user = response?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found.</p>
        <Button asChild className="mt-4">
          <Link to="/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEventType = (type: string) => {
    return type
      .replace(/\./g, " ")
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}>
                  {user.role}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {user.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phone || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      {user.addresses && user.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses ({user.addresses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.addresses.map((address) => (
                <div key={address.id} className="p-3 border rounded-lg">
                  {address.label && (
                    <Badge variant="outline" className="mb-2">{address.label}</Badge>
                  )}
                  <p className="text-sm">{address.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state}, {address.country}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders ({user.orders?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.orders && user.orders.length > 0 ? (
            <div className="space-y-4">
              {user.orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <div>
                      <p className="font-mono font-medium">
                        {order.orderNumber || order.id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[order.status] || "bg-gray-100"}>
                      {order.status}
                    </Badge>
                    <p className="font-bold">LE {order.total.toLocaleString()}</p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">
                      Items ({order.items.length})
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          <div className="w-10 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.productNameEn}</p>
                            <p className="text-muted-foreground text-xs">
                              {item.variantNameEn} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            LE {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No orders yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity ({user.analyticsEvents?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.analyticsEvents && user.analyticsEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.analyticsEvents.slice(0, 20).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant="outline">{formatEventType(event.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </TableCell>
                    <TableCell>
                      {event.data && Object.keys(event.data).length > 0 ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {JSON.stringify(event.data).substring(0, 50)}
                          {JSON.stringify(event.data).length > 50 ? "..." : ""}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No activity recorded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
