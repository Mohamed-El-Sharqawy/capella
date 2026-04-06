import { useState } from "react";
import { Loader2, Plus, Trash2, Pencil, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useReorderBanners,
} from "@/features/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Banner } from "@ecommerce/shared-types";
import { api } from "@/lib/api";

interface BannerFormData {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  buttonTextEn: string;
  buttonTextAr: string;
  linkUrl: string;
  imageUrl: string;
  publicId: string;
  isActive: boolean;
}

const defaultFormData: BannerFormData = {
  titleEn: "",
  titleAr: "",
  subtitleEn: "",
  subtitleAr: "",
  buttonTextEn: "SHOP NOW",
  buttonTextAr: "تسوق الآن",
  linkUrl: "",
  imageUrl: "",
  publicId: "",
  isActive: true,
};

export function BannersPage() {
  const { data: bannersRes, isLoading } = useBanners();
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();
  const reorderMutation = useReorderBanners();

  const [showDialog, setShowDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const banners = bannersRes?.data ?? [];

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData(defaultFormData);
    setShowDialog(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      titleEn: banner.titleEn,
      titleAr: banner.titleAr,
      subtitleEn: banner.subtitleEn || "",
      subtitleAr: banner.subtitleAr || "",
      buttonTextEn: banner.buttonTextEn || "SHOP NOW",
      buttonTextAr: banner.buttonTextAr || "تسوق الآن",
      linkUrl: banner.linkUrl || "",
      imageUrl: banner.imageUrl,
      publicId: banner.publicId,
      isActive: banner.isActive,
    });
    setShowDialog(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("folder", "banners");

      const data = await api.post<{ data: { url: string; publicId: string } }>(
        "/api/images/upload",
        formDataUpload
      );
      
      setFormData((prev) => ({
        ...prev,
        imageUrl: data.data.url,
        publicId: data.data.publicId,
      }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.titleEn || !formData.titleAr || !formData.imageUrl) {
      toast.error("Please fill in required fields (Title EN, Title AR, Image)");
      return;
    }

    try {
      if (editingBanner) {
        await updateMutation.mutateAsync({
          id: editingBanner.id,
          data: formData,
        });
        toast.success("Banner updated");
      } else {
        await createMutation.mutateAsync({
          ...formData,
          position: banners.length,
        });
        toast.success("Banner created");
      }
      setShowDialog(false);
    } catch {
      toast.error("Failed to save banner");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Banner deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await updateMutation.mutateAsync({
        id: banner.id,
        data: { isActive: !banner.isActive },
      });
      toast.success(banner.isActive ? "Banner hidden" : "Banner visible");
    } catch {
      toast.error("Failed to update banner");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...banners];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    try {
      await reorderMutation.mutateAsync(newOrder.map((b) => b.id));
      toast.success("Banner moved up");
    } catch {
      toast.error("Failed to reorder banners");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    const newOrder = [...banners];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    try {
      await reorderMutation.mutateAsync(newOrder.map((b) => b.id));
      toast.success("Banner moved down");
    } catch {
      toast.error("Failed to reorder banners");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hero Banners</h1>
          <p className="text-muted-foreground">
            Manage homepage carousel banners
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No banners yet</p>
            <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
              Add your first banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner, index) => (
            <Card key={banner.id} className={!banner.isActive ? "opacity-50" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || reorderMutation.isPending}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === banners.length - 1 || reorderMutation.isPending}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative w-48 h-28 bg-muted rounded overflow-hidden shrink-0">
                    <img
                      src={banner.imageUrl}
                      alt={banner.titleEn}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold truncate">{banner.titleEn}</h3>
                        <p className="text-sm text-muted-foreground truncate" dir="rtl">
                          {banner.titleAr}
                        </p>
                        {banner.subtitleEn && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {banner.subtitleEn}
                          </p>
                        )}
                        {banner.linkUrl && (
                          <p className="text-xs text-blue-600 mt-1 truncate">
                            Link: {banner.linkUrl}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.isActive}
                          onCheckedChange={() => handleToggleActive(banner)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(banner.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {banner.buttonTextEn && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Button: {banner.buttonTextEn}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Banner Image *</Label>
              {formData.imageUrl ? (
                <div className="relative">
                  <img
                    src={formData.imageUrl}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => document.getElementById("banner-image")?.click()}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
                  onClick={() => document.getElementById("banner-image")?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload banner image
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 1920x1080 or larger
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                id="banner-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Title EN/AR */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titleEn">Title (English) *</Label>
                <Input
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="THE ASILI MEGA BAGGY JEANS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleAr">Title (Arabic) *</Label>
                <Input
                  id="titleAr"
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="جينز أسيلي ميجا باجي"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Subtitle EN/AR */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtitleEn">Subtitle (English)</Label>
                <Input
                  id="subtitleEn"
                  value={formData.subtitleEn}
                  onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                  placeholder="New Collection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitleAr">Subtitle (Arabic)</Label>
                <Input
                  id="subtitleAr"
                  value={formData.subtitleAr}
                  onChange={(e) => setFormData({ ...formData, subtitleAr: e.target.value })}
                  placeholder="مجموعة جديدة"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Button Text EN/AR */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buttonTextEn">Button Text (English)</Label>
                <Input
                  id="buttonTextEn"
                  value={formData.buttonTextEn}
                  onChange={(e) => setFormData({ ...formData, buttonTextEn: e.target.value })}
                  placeholder="SHOP NOW"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonTextAr">Button Text (Arabic)</Label>
                <Input
                  id="buttonTextAr"
                  value={formData.buttonTextAr}
                  onChange={(e) => setFormData({ ...formData, buttonTextAr: e.target.value })}
                  placeholder="تسوق الآن"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Link URL */}
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL</Label>
              <Input
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="/collections/new-arrivals or https://..."
              />
              <p className="text-xs text-muted-foreground">
                Can be a collection slug, product slug, or external URL
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Show this banner on the homepage
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingBanner ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
