import { useState } from "react";
import { Loader2, Eye, ChevronLeft, ChevronRight, Package, User, MapPin, Phone, Mail, Calendar, CreditCard, Banknote, Tag, ArrowRight, Truck, Clock, ClipboardList } from "lucide-react";
import { useOrders, useOrder, useUpdateOrderStatus, useUpdateOrderPaymentStatus, type OrderStatus } from "@/features/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Tab = "new" | "processing" | "delivery";

const TABS: { key: Tab; label: string; icon: any; statuses: string[] }[] = [
  { key: "new", label: "New Orders", icon: ClipboardList, statuses: ["PENDING", "CONFIRMED"] },
  { key: "processing", label: "Processing", icon: Clock, statuses: ["PROCESSING"] },
  { key: "delivery", label: "Delivery", icon: Truck, statuses: ["SHIPPED"] },
];

export function DailyOrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const { data, isLoading, error } = useOrders({
    page: String(page),
    limit: "50",
    statuses: currentTab.statuses.join(","),
  });

  const { data: orderDetail, isLoading: isLoadingDetail } = useOrder(selectedOrderId || "");
  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdateOrderPaymentStatus();

  const orders = data?.data?.data || [];
  const meta = data?.data?.meta || { total: 0, page: 1, limit: 50, totalPages: 0 };

  const handleMoveOrder = async (orderId: string) => {
    let nextStatus: OrderStatus;
    if (activeTab === "new") nextStatus = "PROCESSING";
    else if (activeTab === "processing") nextStatus = "SHIPPED";
    else nextStatus = "DELIVERED";

    try {
      await updateStatus.mutateAsync({ id: orderId, status: nextStatus });
      toast.success(`Order moved to ${activeTab === "new" ? "Processing" : activeTab === "processing" ? "Delivery" : "Delivered"}`);
    } catch {
      toast.error("Failed to update order status");
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

  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatCurrency = (amount: number) => `${amount.toLocaleString()} AED`;

  const moveLabel = activeTab === "new" ? "Start Processing" : activeTab === "processing" ? "Send to Delivery" : "Mark Delivered";
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Orders</h1>
          <p className="mt-1 text-muted-foreground">{todayStr}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg border bg-muted p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all",
                isActive ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeTab === "new" && "Orders placed today that need to be processed."}
          {activeTab === "processing" && "Orders currently being prepared. Move to delivery when ready to ship."}
          {activeTab === "delivery" && "Orders out for delivery. Mark as delivered when completed."}
        </p>
        <div className="text-sm font-medium">{meta.total} order{meta.total !== 1 ? "s" : ""}</div>
      </div>

      {/* Orders Table */}
      <div className="mt-4 rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-500">Failed to load orders</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-[180px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    No {activeTab === "new" ? "new" : activeTab} orders right now.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-sans text-xs">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.user ? `${order.user.firstName} ${order.user.lastName}` : `${order.guestFirstName || order.shippingFirstName} ${order.guestLastName || order.shippingLastName}`}
                        </span>
                        <span className="text-xs text-muted-foreground">{order.user?.email || order.guestEmail || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.shippingPhone || order.guestPhone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</span>
                      </div>
                    </TableCell>
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
                      <Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border-0`}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleMoveOrder(order.id)} disabled={updateStatus.isPending}>
                          {activeTab === "delivery" ? "Delivered" : <><ArrowRight className="h-3 w-3 mr-1" />{moveLabel}</>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(order.id)}><Eye className="h-4 w-4" /></Button>
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
                       <div><div className="text-xs text-muted-foreground">Payment</div>
                         <div className="flex items-center gap-2 mt-1">
                           {(() => {
                             const isOnline = od.paymentMethod === "ZIINA" || od.paymentMethod === "TABBY" || od.paymentMethod === "TAMARA";
                             const isRefunded = od.status === "REFUNDED";
                             const pmBadge = isOnline
                               ? <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><CreditCard className="h-3 w-3" /> {od.paymentMethod}</Badge>
                               : <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Banknote className="h-3 w-3" /> COD</Badge>;
                             if (isRefunded) return <>{pmBadge}<Badge className="bg-orange-100 text-orange-800 border-0">Refunded</Badge></>;
                             if (isOnline) return <>{pmBadge}<Badge className="bg-green-100 text-green-800 border-0">Paid</Badge></>;
                             return (
                               <>
                                 {pmBadge}
                                 <button onClick={() => handlePaymentToggle(od.id, !!od.paidAt)}>
                                   {od.paidAt ? (
                                     <Badge className="bg-green-100 text-green-800 border-0 cursor-pointer">Paid</Badge>
                                   ) : (
                                     <Badge className="bg-gray-100 text-gray-600 border-0 cursor-pointer">Unpaid</Badge>
                                   )}
                                 </button>
                               </>
                             );
                           })()}
                         </div>
                       </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-3"><User className="h-4 w-4" /> Customer</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><div className="text-xs text-muted-foreground">Name</div><div>{od.user ? `${od.user.firstName} ${od.user.lastName}` : `${od.guestFirstName || od.shippingFirstName} ${od.guestLastName || od.shippingLastName}`}</div></div>
                        <div><div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</div><div>{od.user?.email || od.guestEmail || "-"}</div></div>
                        <div><div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</div><div>{od.shippingPhone || od.guestPhone || "-"}</div></div>
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
                        <h3 className="font-semibold mb-2">Note</h3>
                        <p className="text-sm text-muted-foreground">{od.note}</p>
                      </div>
                    )}

                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-3"><Package className="h-4 w-4" /> Items ({od.items?.length || 0})</h3>
                      <div className="space-y-3">
                        {od.items?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                            {item.imageUrl && <img src={item.imageUrl} alt={item.productNameEn} className="h-14 w-14 rounded-md object-cover" />}
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.productNameEn}</div>
                              <div className="text-xs text-muted-foreground">{item.variantNameEn}</div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">{formatCurrency(item.price)}</div>
                              <div className="text-muted-foreground">Qty: {item.quantity}</div>
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
                          return (
                            <>
                              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(itemsTotal)}</span></div>
                              {discount > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-1 text-green-600"><Tag className="h-3 w-3" />Discount</span>
                                  <span className="text-green-600">-{formatCurrency(discount)}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="font-semibold">Total</span>
                                <span className="text-xl font-bold">{formatCurrency(od.total)}</span>
                              </div>
                            </>
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
    </div>
  );
}
