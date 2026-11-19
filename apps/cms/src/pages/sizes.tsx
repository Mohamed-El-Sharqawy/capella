import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { useSizes, useCreateSize, useUpdateSize, useDeleteSize } from "@/features/sizes";
import type { Size } from "@/features/sizes";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export function SizesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);

  const { data: response, isLoading } = useSizes();
  const createMutation = useCreateSize();
  const updateMutation = useUpdateSize();
  const deleteMutation = useDeleteSize();

  const sizes = response?.data ?? [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      nameEn: formData.get("nameEn") as string,
      nameAr: formData.get("nameAr") as string,
    };

    try {
      if (editingSize) {
        await updateMutation.mutateAsync({ id: editingSize.id, body });
        toast.success("Size updated");
      } else {
        await createMutation.mutateAsync(body);
        toast.success("Size created");
      }
      setIsDialogOpen(false);
      setEditingSize(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this size? Variants using it will keep running, just without a size.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Size deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  /** Swap positions with the neighbouring row (persisted via position update). */
  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = sizes[index + direction];
    const current = sizes[index];
    if (!target || !current) return;
    try {
      await Promise.all([
        updateMutation.mutateAsync({
          id: current.id,
          body: { position: target.position },
        }),
        updateMutation.mutateAsync({
          id: target.id,
          body: { position: current.position },
        }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder");
    }
  };

  const openEdit = (size: Size) => {
    setEditingSize(size);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingSize(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sizes</h1>
          <p className="mt-1 text-muted-foreground">
            Manage optional product sizes (e.g. "S (15.5cm)", "52").
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Size
        </Button>
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : sizes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No sizes found.
                </TableCell>
              </TableRow>
            ) : (
              sizes.map((size, index) => (
                <TableRow key={size.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0 || updateMutation.isPending}
                        onClick={() => handleMove(index, -1)}
                        title="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === sizes.length - 1 || updateMutation.isPending}
                        onClick={() => handleMove(index, 1)}
                        title="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{size.nameEn}</TableCell>
                  <TableCell>{size.nameAr}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(size)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(size.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSize ? "Edit Size" : "Add Size"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  defaultValue={editingSize?.nameEn ?? ""}
                  placeholder='e.g. "M (17cm)" or "52"'
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input
                  id="nameAr"
                  name="nameAr"
                  defaultValue={editingSize?.nameAr ?? ""}
                  placeholder="مثال: ١٧ سم"
                  required
                  dir="rtl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingSize ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
