import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useStones, useCreateStone, useUpdateStone, useDeleteStone } from "@/features/stones";
import type { Stone } from "@/features/stones";
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

export function StonesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStone, setEditingStone] = useState<Stone | null>(null);

  const { data: response, isLoading } = useStones();
  const createMutation = useCreateStone();
  const updateMutation = useUpdateStone();
  const deleteMutation = useDeleteStone();

  const stones = response?.data ?? [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      nameEn: formData.get("nameEn") as string,
      nameAr: formData.get("nameAr") as string,
    };

    try {
      if (editingStone) {
        await updateMutation.mutateAsync({ id: editingStone.id, body });
        toast.success("Stone updated");
      } else {
        await createMutation.mutateAsync(body);
        toast.success("Stone created");
      }
      setIsDialogOpen(false);
      setEditingStone(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stone?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Stone deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const openEdit = (stone: Stone) => {
    setEditingStone(stone);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingStone(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stones</h1>
          <p className="mt-1 text-muted-foreground">
            Manage product stones/gemstones.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stone
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
            ) : stones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No stones found.
                </TableCell>
              </TableRow>
            ) : (
              stones.map((stone) => (
                <TableRow key={stone.id}>
                  <TableCell className="font-medium">{stone.nameEn}</TableCell>
                  <TableCell>{stone.nameAr}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(stone)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(stone.id)}
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
              {editingStone ? "Edit Stone" : "Add Stone"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  defaultValue={editingStone?.nameEn ?? ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input
                  id="nameAr"
                  name="nameAr"
                  defaultValue={editingStone?.nameAr ?? ""}
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
                {editingStone ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
