import { useState } from "react";
import { Search, Loader2, Eye, ChevronLeft, ChevronRight, Package, User, MapPin, Phone, Mail, Calendar, CreditCard, Banknote, Tag, Trash2, CheckSquare, Square, XSquare } from "lucide-react";
import { ORDER_STATUSES, getShippingCost } from "@ecommerce/shared-utils";
import type { Order } from "@ecommerce/shared-types";
import { useOrders, useOrder, useUpdateOrderStatus, useUpdateOrderPaymentStatus, useDeleteOrder, useBulkDeleteOrders, type OrderStatus } from "@/features/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => setDebouncedSearch(value), 300);
    setSearchTimeout(t);
  };

  const { data, isLoading, error } = useOrders({
    page: String(page),
    limit: "20",
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const { data: orderDetail, isLoading: isLoadingDetail } = useOrder(selectedOrderId || "");
  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdateOrderPaymentStatus();
  const deleteMutation = useDeleteOrder();
  const bulkDeleteMutation = useBulkDeleteOrders();

  const orders = (data?.data?.data || []) as Order[];
  const meta = data?.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const allVisibleSelected = orders.length > 0 && orders.every((o: any) => selectedIds.has(o.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o: any) => o.id)));
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handlePaymentToggle = async (orderId: string, currentlyPaid: boolean) => {
    try {
      await updatePaymentStatus.mutateAsync({ id: orderId, paid: !currentlyPaid });
      toast.success(!currentlyPaid ? "Marked as paid" : "Marked as unpaid");
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) {
        await deleteMutation.mutateAsync(deleteTarget.ids[0]);
      } else {
        await bulkDeleteMutation.mutateAsync(deleteTarget.ids);
      }
      toast.success(deleteTarget.ids.length === 1 ? "Order deleted" : `${deleteTarget.ids.length} orders deleted`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        deleteTarget.ids.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete order(s)");
    }
  };

  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatCurrency = (amount: number) => `${amount.toLocaleString()} AED`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1 text-muted-foreground">View and manage customer orders.</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteTarget({ ids: Array.from(selectedIds), label: `${selectedIds.size} orders` })}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              <XSquare className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by order ID, name, or email..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm" />
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">{meta.total} order{meta.total !== 1 ? "s" : ""} found</div>

      <div className="mt-4 rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-500">Failed to load orders</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                    {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">No orders found.</TableCell>
                </TableRow>
              ) : (
                orders.map((order: any) => (
                  <TableRow key={order.id} className={selectedIds.has(order.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <button onClick={() => toggleSelect(order.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedIds.has(order.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-sans text-xs">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.user ? `${order.user.firstName} ${order.user.lastName}` : `${order.guestFirstName || order.shippingFirstName} ${order.guestLastName || order.shippingLastName}`}</span>
                        <span className="text-xs text-muted-foreground">{order.user?.email || order.guestEmail || "Guest"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      {order.paymentMethod === "ZIINA" || order.paymentMethod === "TABBY" || order.paymentMethod === "TAMARA" ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><CreditCard className="h-3 w-3" />{order.paymentMethod}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Banknote className="h-3 w-3" />COD</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isOnline = order.paymentMethod === "ZIINA" || order.paymentMethod === "TABBY" || order.paymentMethod === "TAMARA";
                        const isRefunded = order.status === "REFUNDED";
                        if (isRefunded) return <Badge className="bg-orange-100 text-orange-800 border-0">Refunded</Badge>;
                        if (isOnline) return <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>;
                        return (
                          <button onClick={() => handlePaymentToggle(order.id, !!order.paidAt)} className="focus:outline-none" title={order.paidAt ? "Click to mark as unpaid" : "Click to mark as paid"}>
                            {order.paidAt ? (
                              <Badge className="bg-green-100 text-green-800 border-0 cursor-pointer hover:bg-green-200">Paid</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600 border-0 cursor-pointer hover:bg-gray-200">Unpaid</Badge>
                            )}
                          </button>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}>
                        <SelectTrigger className="h-8 w-[130px]" onClick={(e) => e.stopPropagation()}>
                          <SelectValue><Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border-0`}>{order.status}</Badge></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}><Badge className={`${STATUS_COLORS[status]} border-0`}>{status}</Badge></SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(order.id)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget({ ids: [order.id], label: order.id.slice(0, 8) + "..." })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" />Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Next<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Order Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : orderDetail?.data ? (
            <div className="space-y-6">
              {(() => {
                const od = orderDetail.data;
                return (
                  <>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div><div className="text-xs text-muted-foreground">Order ID</div><div className="font-sans text-sm">{od.id}</div></div>
                <div><div className="text-xs text-muted-foreground">Status</div><Badge className={`${STATUS_COLORS[od.status]} border-0 mt-1`}>{od.status}</Badge></div>
                <div><div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Created</div><div className="text-sm">{formatDate(od.createdAt)}</div></div>
                <div><div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Updated</div><div className="text-sm">{formatDate(od.updatedAt)}</div></div>
                <div><div className="text-xs text-muted-foreground">Payment Method</div>
                  {od.paymentMethod === "ZIINA" || od.paymentMethod === "TABBY" || od.paymentMethod === "TAMARA" ? (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 mt-1"><CreditCard className="h-3 w-3" /> Online Payment</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 mt-1"><Banknote className="h-3 w-3" /> Cash on Delivery</Badge>
                  )}
                </div>
                <div><div className="text-xs text-muted-foreground">Payment Status</div>
                  {(() => {
                    const isOnline = od.paymentMethod === "ZIINA" || od.paymentMethod === "TABBY" || od.paymentMethod === "TAMARA";
                    const isRefunded = od.status === "REFUNDED";
                    if (isRefunded) return <Badge className="bg-orange-100 text-orange-800 border-0 mt-1">Refunded</Badge>;
                    if (isOnline) return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 mt-1">Paid</Badge>;
                    return (
                      <button onClick={() => handlePaymentToggle(od.id, !!od.paidAt)}>
                        {od.paidAt ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 mt-1 cursor-pointer">Paid {formatDate(od.paidAt)}</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200 mt-1 cursor-pointer">Unpaid (click to mark paid)</Badge>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><User className="h-4 w-4" /> Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(() => {
                    const isGuest = od.user?.role === "GUEST" || od.guestEmail;
                    const userName = od.user ? `${od.user.firstName} ${od.user.lastName}` : `${od.guestFirstName || od.shippingFirstName} ${od.guestLastName || od.shippingLastName}`;
                    const userEmail = od.user?.email || od.guestEmail;
                    const userPhone = od.guestPhone || od.shippingPhone;
                    return (
                      <>
                        <div><div className="text-xs text-muted-foreground">Name</div><div>{userName}</div></div>
                        <div><div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</div><div>{userEmail || "-"}</div></div>
                        <div><div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</div><div>{userPhone || "-"}</div></div>
                        <div><div className="text-xs text-muted-foreground">Account Type</div>
                          {isGuest ? <Badge variant="secondary" className="bg-orange-100 text-orange-700">Guest</Badge> : <Badge variant="outline" className="bg-green-100 text-green-700">Registered User</Badge>}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><MapPin className="h-4 w-4" /> Shipping Address</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><div className="text-xs text-muted-foreground">Recipient</div><div>{od.shippingFirstName} {od.shippingLastName}</div></div>
                  <div><div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</div><div>{od.shippingPhone || "-"}</div></div>
                  <div className="col-span-2"><div className="text-xs text-muted-foreground">Street</div><div>{od.shippingStreet}</div></div>
                  <div><div className="text-xs text-muted-foreground">City</div><div>{od.shippingCity}</div></div>
                  <div><div className="text-xs text-muted-foreground">State/Area</div><div>{od.shippingState}</div></div>
                  <div><div className="text-xs text-muted-foreground">Zip Code</div><div>{od.shippingZipCode}</div></div>
                  <div><div className="text-xs text-muted-foreground">Country</div><div>{od.shippingCountry}</div></div>
                </div>
              </div>

              {od.note && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Order Note</h3>
                  <p className="text-sm text-muted-foreground">{od.note}</p>
                </div>
              )}

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><Package className="h-4 w-4" /> Order Items ({od.items?.length || 0})</h3>
                <div className="space-y-3">
                  {od.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.productNameEn} className="h-16 w-16 rounded-md object-cover" />}
                      <div className="flex-1">
                        <div className="font-medium">{item.productNameEn}</div>
                        <div className="text-sm text-muted-foreground">{item.variantNameEn}{item.size && ` \u2022 Size: ${item.size}`}{item.color && ` \u2022 Color: ${item.color}`}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.price)}</div>
                        <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                        <div className="text-sm font-medium text-primary">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="space-y-2">
                  {(() => {
                    const itemsTotal = (od.items || []).reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
                    const discount = od.discountAmount || 0;
                    const shipping = getShippingCost(itemsTotal);
                    const total = od.total;
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal ({od.items?.length || 0} items)</span><span>{formatCurrency(itemsTotal)}</span></div>
                        {discount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-green-600"><Tag className="h-3 w-3" />{od.coupon ? `Coupon "${od.coupon.code}" (${od.coupon.discountType === "PERCENTAGE" ? `${od.coupon.discountValue}%` : formatCurrency(od.coupon.discountValue)})` : "Discount"}</span>
                            <span className="text-green-600">-{formatCurrency(discount)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : formatCurrency(shipping)}</span></div>
                        <div className="flex items-center justify-between pt-2 border-t"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><span className="font-semibold">Total</span></div><div className="text-xl font-bold">{formatCurrency(total)}</div></div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div><div className="font-semibold">Order Status</div><div className="text-sm text-muted-foreground">Change the order status</div></div>
                  <Select value={od.status} onValueChange={(value) => handleStatusChange(od.id, value as OrderStatus)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}><Badge className={`${STATUS_COLORS[status]} border-0`}>{status}</Badge></SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div><div className="font-semibold">Payment Status</div>
                    {(() => {
                      const isOnline = od.paymentMethod === "ZIINA" || od.paymentMethod === "TABBY" || od.paymentMethod === "TAMARA";
                      const isRefunded = od.status === "REFUNDED";
                      if (isRefunded) return <div className="text-sm text-muted-foreground">Refunded</div>;
                      if (isOnline) return <div className="text-sm text-muted-foreground">Paid (Online)</div>;
                      return <div className="text-sm text-muted-foreground">{od.paidAt ? `Paid on ${formatDate(od.paidAt)}` : "Not yet paid"}</div>;
                    })()}
                  </div>
                  {(() => {
                    const isOnline = od.paymentMethod === "ZIINA" || od.paymentMethod === "TABBY" || od.paymentMethod === "TAMARA";
                    const isRefunded = od.status === "REFUNDED";
                    if (isRefunded) return <Badge className="bg-orange-100 text-orange-800 border-0">Refunded</Badge>;
                    if (isOnline) return <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>;
                    return (
                      <Button variant={od.paidAt ? "outline" : "default"} size="sm" onClick={() => handlePaymentToggle(od.id, !!od.paidAt)}>
                        {od.paidAt ? "Mark Unpaid" : "Mark as Paid"}
                      </Button>
                    );
                  })()}
                </div>
              </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">Order not found</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.ids.length === 1 ? "Order" : "Orders"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.label}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}>
              {(deleteMutation.isPending || bulkDeleteMutation.isPending) ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting...</>) : (`Delete ${deleteTarget?.ids.length === 1 ? "Order" : `${deleteTarget?.ids.length} Orders`}`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
