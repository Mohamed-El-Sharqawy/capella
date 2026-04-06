import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useClarities, useCreateClarity, useUpdateClarity, useDeleteClarity } from "@/features/clarities";
import type { Clarity } from "@/features/clarities";
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

export function ClaritiesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClarity, setEditingClarity] = useState<Clarity | null>(null);

  const { data: response, isLoading } = useClarities();
  const createMutation = useCreateClarity();
  const updateMutation = useUpdateClarity();
  const deleteMutation = useDeleteClarity();

  const clarities = response?.data ?? [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      nameEn: formData.get("nameEn") as string,
      nameAr: formData.get("nameAr") as string,
    };

    try {
      if (editingClarity) {
        await updateMutation.mutateAsync({ id: editingClarity.id, body });
        toast.success("Clarity updated");
      } else {
        await createMutation.mutateAsync(body);
        toast.success("Clarity created");
      }
      setIsDialogOpen(false);
      setEditingClarity(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this clarity?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Clarity deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const openEdit = (clarity: Clarity) => {
    setEditingClarity(clarity);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingClarity(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clarities</h1>
          <p className="mt-1 text-muted-foreground">
            Manage product clarities.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Clarity
        </Button>
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : clarities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No clarities found.
                </TableCell>
              </TableRow>
            ) : (
              clarities.map((clarity) => (
                <TableRow key={clarity.id}>
                  <TableCell className="font-medium">{clarity.nameEn}</TableCell>
                  <TableCell>{clarity.nameAr}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(clarity)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(clarity.id)}
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
              {editingClarity ? "Edit Clarity" : "Add Clarity"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  defaultValue={editingClarity?.nameEn ?? ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input
                  id="nameAr"
                  name="nameAr"
                  defaultValue={editingClarity?.nameAr ?? ""}
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
                {editingClarity ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
