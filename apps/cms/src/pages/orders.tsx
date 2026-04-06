import { useState } from "react";
import { Search, Loader2, Eye, ChevronLeft, ChevronRight, Package, User, MapPin, Phone, Mail, Calendar, CreditCard } from "lucide-react";
import { ORDER_STATUSES } from "@ecommerce/shared-utils";
import type { Order } from "@ecommerce/shared-types";
import { useOrders, useOrder, useUpdateOrderStatus, type OrderStatus } from "@/features/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading, error } = useOrders({
    page: String(page),
    limit: "20",
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const { data: orderDetail, isLoading: isLoadingDetail } = useOrder(selectedOrderId || "");
  const updateStatus = useUpdateOrderStatus();

  const orders = (data?.data?.data || []) as Order[];
  const meta = data?.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `EGP ${amount.toLocaleString()}`;
  };

  // Filter orders by search
  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.shippingFirstName?.toLowerCase().includes(searchLower) ||
      order.shippingLastName?.toLowerCase().includes(searchLower) ||
      order.guestEmail?.toLowerCase().includes(searchLower) ||
      order.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage customer orders.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order ID, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="mt-4 text-sm text-muted-foreground">
        {meta.total} order{meta.total !== 1 ? "s" : ""} found
      </div>

      {/* Orders Table */}
      <div className="mt-4 rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-500">
            Failed to load orders
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.user
                            ? `${order.user.firstName} ${order.user.lastName}`
                            : `${order.guestFirstName || order.shippingFirstName} ${order.guestLastName || order.shippingLastName}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.user?.email || order.guestEmail || "Guest"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                      >
                        <SelectTrigger className="h-8 w-[130px]" onClick={(e) => e.stopPropagation()}>
                          <SelectValue>
                            <Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border-0`}>
                              {order.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              <Badge className={`${STATUS_COLORS[status]} border-0`}>
                                {status}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orderDetail?.data ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Order ID</div>
                  <div className="font-mono text-sm">{orderDetail.data.id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge className={`${STATUS_COLORS[orderDetail.data.status]} border-0 mt-1`}>
                    {orderDetail.data.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created
                  </div>
                  <div className="text-sm">{formatDate(orderDetail.data.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Updated
                  </div>
                  <div className="text-sm">{formatDate(orderDetail.data.updatedAt)}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" /> Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(() => {
                    const isGuest = orderDetail.data.user?.role === "GUEST" || orderDetail.data.guestEmail;
                    const userName = orderDetail.data.user 
                      ? `${orderDetail.data.user.firstName} ${orderDetail.data.user.lastName}`
                      : `${orderDetail.data.guestFirstName || orderDetail.data.shippingFirstName} ${orderDetail.data.guestLastName || orderDetail.data.shippingLastName}`;
                    const userEmail = orderDetail.data.user?.email || orderDetail.data.guestEmail;
                    const userPhone = orderDetail.data.guestPhone || orderDetail.data.shippingPhone;

                    return (
                      <>
                        <div>
                          <div className="text-xs text-muted-foreground">Name</div>
                          <div>{userName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </div>
                          <div>{userEmail || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone
                          </div>
                          <div>{userPhone || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Account Type</div>
                          {isGuest ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">Guest</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-700">Registered User</Badge>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Recipient</div>
                    <div>{orderDetail.data.shippingFirstName} {orderDetail.data.shippingLastName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </div>
                    <div>{orderDetail.data.shippingPhone || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Street</div>
                    <div>{orderDetail.data.shippingStreet}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">City</div>
                    <div>{orderDetail.data.shippingCity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">State/Area</div>
                    <div>{orderDetail.data.shippingState}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Zip Code</div>
                    <div>{orderDetail.data.shippingZipCode}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Country</div>
                    <div>{orderDetail.data.shippingCountry}</div>
                  </div>
                </div>
              </div>

              {/* Order Note */}
              {orderDetail.data.note && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Order Note</h3>
                  <p className="text-sm text-muted-foreground">{orderDetail.data.note}</p>
                </div>
              )}

              {/* Order Items */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" /> Order Items ({orderDetail.data.items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {orderDetail.data.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productNameEn}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.productNameEn}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.variantNameEn}
                          {item.size && ` • Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {item.sku || "-"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.price)}</div>
                        <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                        <div className="text-sm font-medium text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">Order Total</span>
                  </div>
                  <div className="text-xl font-bold">{formatCurrency(orderDetail.data.total)}</div>
                </div>
              </div>

              {/* Update Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-semibold">Update Status</div>
                  <div className="text-sm text-muted-foreground">Change the order status</div>
                </div>
                <Select
                  value={orderDetail?.data?.status}
                  onValueChange={(value) => handleStatusChange(orderDetail?.data?.id || "", value as OrderStatus)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        <Badge className={`${STATUS_COLORS[status]} border-0`}>
                          {status}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Order not found
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
