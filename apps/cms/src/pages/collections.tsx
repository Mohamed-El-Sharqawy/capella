import { useState, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, Upload, X, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useAllCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useUploadCollectionImage,
  useDeleteCollectionImage,
} from "@/features/collections";
import type { Collection } from "@ecommerce/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: response, isLoading } = useAllCollections();
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();
  const uploadImageMutation = useUploadCollectionImage();
  const deleteImageMutation = useDeleteCollectionImage();

  const collections = response?.data ?? [];
  
  // Separate top-level and child collections
  const topLevelCollections = collections.filter((c: any) => !c.parentId);
  const getChildren = (parentId: string) => 
    collections.filter((c: any) => c.parentId === parentId);
  
  const filteredCollections = topLevelCollections.filter(
    (c) =>
      c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      c.nameAr.includes(search)
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      nameEn: formData.get("nameEn") as string,
      nameAr: formData.get("nameAr") as string,
      descriptionEn: formData.get("descriptionEn") as string,
      descriptionAr: formData.get("descriptionAr") as string,
      metaTitleEn: (formData.get("metaTitleEn") as string) || undefined,
      metaTitleAr: (formData.get("metaTitleAr") as string) || undefined,
      metaDescriptionEn: (formData.get("metaDescriptionEn") as string) || undefined,
      metaDescriptionAr: (formData.get("metaDescriptionAr") as string) || undefined,
      inHeader: formData.get("inHeader") === "on",
      isFeaturedOnHome: formData.get("isFeaturedOnHome") === "on",
      homeFeaturedPosition: Number(formData.get("homeFeaturedPosition")) || 0,
      position: Number(formData.get("position")) || 0,
      parentId: (formData.get("parentId") as string) === "none" ? null : (formData.get("parentId") as string) || null,
    };

    try {
      let collectionId: string;

      if (editingCollection) {
        await updateMutation.mutateAsync({ id: editingCollection.id, body });
        collectionId = editingCollection.id;
        toast.success("Collection updated");
      } else {
        const result = await createMutation.mutateAsync(body);
        collectionId = result.data!.id;
        toast.success("Collection created");
      }

      if (selectedFile) {
        await uploadImageMutation.mutateAsync({
          collectionId,
          file: selectedFile,
          altEn: body.nameEn,
          altAr: body.nameAr,
        });
        toast.success("Image uploaded");
      }

      setIsDialogOpen(false);
      setEditingCollection(null);
      clearFile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDeleteImage = async (collectionId: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      await deleteImageMutation.mutateAsync(collectionId);
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Collection deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const openEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setPreviewUrl(collection.image?.url ?? null);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingCollection(null);
    clearFile();
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="mt-1 text-muted-foreground">
            Manage product collections.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Collection
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
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
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>In Header</TableHead>
              <TableHead>Home Hero</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No collections found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.flatMap((collection) => {
                const children = getChildren(collection.id);
                const rows = [];
                
                // Parent row
                rows.push(
                  <TableRow key={collection.id} className="bg-background">
                    <TableCell>
                      {collection.image?.url ? (
                        <img
                          src={collection.image.url}
                          alt={collection.image.altEn || collection.nameEn}
                          className="h-12 w-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setImageModalUrl(collection.image?.url ?? null)}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {children.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        {collection.nameEn}
                      </div>
                    </TableCell>
                    <TableCell>{collection.nameAr}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(collection as any)._count?.products ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(collection as any).inHeader ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(collection as any).isFeaturedOnHome ? (
                        <Badge variant="default" className="bg-purple-600">#{(collection as any).homeFeaturedPosition || 1}</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/collections/${collection.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(collection)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(collection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
                
                // Child rows
                children.forEach((child: any) => {
                  rows.push(
                    <TableRow key={child.id} className="bg-muted/30">
                      <TableCell>
                        {child.image?.url ? (
                          <img
                            src={child.image.url}
                            alt={child.image.altEn || child.nameEn}
                            className="h-10 w-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setImageModalUrl(child.image?.url ?? null)}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            No img
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 pl-6 text-muted-foreground">
                          └ {child.nameEn}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{child.nameAr}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {child._count?.products ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {child.inHeader ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {collection.nameEn}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/collections/${child.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(child)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(child.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                });
                
                return rows;
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? "Edit Collection" : "Add Collection"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  defaultValue={editingCollection?.nameEn ?? ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input
                  id="nameAr"
                  name="nameAr"
                  defaultValue={editingCollection?.nameAr ?? ""}
                  required
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Textarea
                  id="descriptionEn"
                  name="descriptionEn"
                  defaultValue={editingCollection?.descriptionEn ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                <Textarea
                  id="descriptionAr"
                  name="descriptionAr"
                  defaultValue={editingCollection?.descriptionAr ?? ""}
                  dir="rtl"
                />
              </div>

              {/* SEO Meta Fields */}
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-medium mb-3">SEO Meta Information (Optional)</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="metaTitleEn">Meta Title (English)</Label>
                      <Input
                        id="metaTitleEn"
                        name="metaTitleEn"
                        defaultValue={(editingCollection as any)?.metaTitleEn ?? ""}
                        placeholder="SEO title for search engines"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="metaTitleAr">Meta Title (Arabic)</Label>
                      <Input
                        id="metaTitleAr"
                        name="metaTitleAr"
                        defaultValue={(editingCollection as any)?.metaTitleAr ?? ""}
                        placeholder="عنوان SEO لمحركات البحث"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="metaDescriptionEn">Meta Description (English)</Label>
                      <Textarea
                        id="metaDescriptionEn"
                        name="metaDescriptionEn"
                        defaultValue={(editingCollection as any)?.metaDescriptionEn ?? ""}
                        placeholder="Brief description for search results"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="metaDescriptionAr">Meta Description (Arabic)</Label>
                      <Textarea
                        id="metaDescriptionAr"
                        name="metaDescriptionAr"
                        defaultValue={(editingCollection as any)?.metaDescriptionAr ?? ""}
                        placeholder="وصف مختصر لنتائج البحث"
                        dir="rtl"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    type="number"
                    defaultValue={(editingCollection as any)?.position ?? 0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parentId">Parent Collection</Label>
                  <Select name="parentId" defaultValue={(editingCollection as any)?.parentId ?? "none"}>
                    <SelectTrigger>
                      <SelectValue placeholder="None (Top Level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {collections
                        .filter((c) => c.id !== editingCollection?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nameEn}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="inHeader"
                  name="inHeader"
                  defaultChecked={(editingCollection as any)?.inHeader ?? false}
                />
                <Label htmlFor="inHeader">Show in Header Navigation</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="isFeaturedOnHome"
                  name="isFeaturedOnHome"
                  defaultChecked={(editingCollection as any)?.isFeaturedOnHome ?? false}
                />
                <Label htmlFor="isFeaturedOnHome">Feature on Homepage Hero</Label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="homeFeaturedPosition">Homepage Position</Label>
                <Select name="homeFeaturedPosition" defaultValue={String((editingCollection as any)?.homeFeaturedPosition ?? 1)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Position 1 (Top Left)</SelectItem>
                    <SelectItem value="2">Position 2 (Top Right)</SelectItem>
                    <SelectItem value="3">Position 3 (Bottom Left)</SelectItem>
                    <SelectItem value="4">Position 4 (Bottom Center)</SelectItem>
                    <SelectItem value="5">Position 5 (Bottom Right)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Up to 5 collections: 2 on top row, 3 on bottom row
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Image</Label>
                <p className="text-xs text-muted-foreground">
                  Recommended: 337 × 505 px
                </p>
                {previewUrl ? (
                  <div className="relative rounded-lg overflow-hidden border" style={{ width: 337, height: 505 }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => {
                        if (editingCollection?.image) {
                          handleDeleteImage(editingCollection.id);
                        }
                        clearFile();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                    style={{ width: 168, height: 252 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center px-2">
                      Click to upload
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
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
                {editingCollection ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!imageModalUrl} onOpenChange={() => setImageModalUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {imageModalUrl && (
            <img
              src={imageModalUrl}
              alt="Collection"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
