import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@/features/coupons";
import type { Coupon, DiscountType } from "@ecommerce/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function CouponsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const { data: response, isLoading } = useCoupons();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const coupons = response?.data ?? [];
  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingCoupon(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const body = {
      code: formData.get("code") as string,
      discountType: formData.get("discountType") as DiscountType,
      discountValue: parseFloat(formData.get("discountValue") as string),
      minOrderAmount: formData.get("minOrderAmount")
        ? parseFloat(formData.get("minOrderAmount") as string)
        : undefined,
      maxDiscountAmount: formData.get("maxDiscountAmount")
        ? parseFloat(formData.get("maxDiscountAmount") as string)
        : undefined,
      usageLimit: formData.get("usageLimit")
        ? parseInt(formData.get("usageLimit") as string)
        : undefined,
      usageLimitPerUser: formData.get("usageLimitPerUser")
        ? parseInt(formData.get("usageLimitPerUser") as string)
        : undefined,
      startsAt: formData.get("startsAt") as string || undefined,
      expiresAt: formData.get("expiresAt") as string || undefined,
      isActive: formData.get("isActive") === "on",
    };

    try {
      if (editingCoupon) {
        await updateMutation.mutateAsync({ id: editingCoupon.id, body });
        toast.success("Coupon updated");
      } else {
        await createMutation.mutateAsync(body);
        toast.success("Coupon created");
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Coupon deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  };

  const isUsageLimitReached = (coupon: Coupon) => {
    if (!coupon.usageLimit) return false;
    return coupon.usageCount >= coupon.usageLimit;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search coupons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredCoupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No coupons found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}%`
                      : `$${coupon.discountValue.toFixed(2)}`}
                    {coupon.maxDiscountAmount && coupon.discountType === "PERCENTAGE" && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (max ${coupon.maxDiscountAmount})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon.usageCount}
                    {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(coupon.startsAt)} — {formatDate(coupon.expiresAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!coupon.isActive ? (
                        <Badge variant="secondary">Inactive</Badge>
                      ) : isExpired(coupon) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isUsageLimitReached(coupon) ? (
                        <Badge variant="destructive">Limit Reached</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(coupon)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={editingCoupon?.code ?? ""}
                  placeholder="SAVE20"
                  className="uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Discount Type *</Label>
                  <Select
                    name="discountType"
                    defaultValue={editingCoupon?.discountType ?? "PERCENTAGE"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discountValue">Discount Value *</Label>
                  <Input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingCoupon?.discountValue ?? ""}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minOrderAmount">Min Order Amount</Label>
                  <Input
                    id="minOrderAmount"
                    name="minOrderAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingCoupon?.minOrderAmount ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxDiscountAmount">Max Discount Amount</Label>
                  <Input
                    id="maxDiscountAmount"
                    name="maxDiscountAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingCoupon?.maxDiscountAmount ?? ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    name="usageLimit"
                    type="number"
                    min="1"
                    defaultValue={editingCoupon?.usageLimit ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="usageLimitPerUser">Per User Limit</Label>
                  <Input
                    id="usageLimitPerUser"
                    name="usageLimitPerUser"
                    type="number"
                    min="1"
                    defaultValue={editingCoupon?.usageLimitPerUser ?? ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Starts At</Label>
                  <Input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={
                      editingCoupon?.startsAt
                        ? new Date(editingCoupon.startsAt).toISOString().slice(0, 16)
                        : ""
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    name="expiresAt"
                    type="datetime-local"
                    defaultValue={
                      editingCoupon?.expiresAt
                        ? new Date(editingCoupon.expiresAt).toISOString().slice(0, 16)
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingCoupon?.isActive ?? true}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingCoupon ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
