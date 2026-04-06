import { useState, useRef } from "react";
import { Loader2, Plus, Trash2, Video, Image as ImageIcon } from "lucide-react";
import {
  useShoppableVideos,
  useCreateShoppableVideo,
  useUpdateShoppableVideo,
  useDeleteShoppableVideo,
  useInstagramPosts,
  useCreateInstagramPost,
  useUpdateInstagramPost,
  useDeleteInstagramPost,
} from "@/features/content";
import { useProducts } from "@/features/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">Manage shoppable videos and Instagram gallery</p>
      </div>

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Shoppable Videos
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            909 - FW25 Drops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <ShoppableVideosSection />
        </TabsContent>

        <TabsContent value="instagram">
          <InstagramPostsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShoppableVideosSection() {
  const { data: videosRes, isLoading } = useShoppableVideos();
  const { data: productsRes } = useProducts({ limit: "100" });
  const createMutation = useCreateShoppableVideo();
  const updateMutation = useUpdateShoppableVideo();
  const deleteMutation = useDeleteShoppableVideo();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const videos = videosRes?.data ?? [];
  const products = productsRes?.data?.data ?? [];

  const handleCreate = async () => {
    if (!videoFile || !thumbnailFile || !selectedProductId) {
      toast.error("Please select video, thumbnail, and product");
      return;
    }

    try {
      await createMutation.mutateAsync({
        video: videoFile,
        thumbnail: thumbnailFile,
        productId: selectedProductId,
        position: videos.length,
        isActive: true,
      });
      toast.success("Video added");
      setShowAddDialog(false);
      setVideoFile(null);
      setThumbnailFile(null);
      setSelectedProductId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add video");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isActive: !isActive } });
      toast.success(isActive ? "Video hidden" : "Video visible");
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Video deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shoppable Videos</CardTitle>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Video
        </Button>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No shoppable videos yet. Add your first video above.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`border rounded-lg overflow-hidden ${!video.isActive ? "opacity-50" : ""}`}
              >
                <div className="relative aspect-3/4">
                  <img
                    src={video.thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Video className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="font-medium text-sm truncate">
                    {video.product?.nameEn ?? "Unknown Product"}
                  </p>
                  {video.product?.variants?.[0] && (
                    <p className="text-sm text-muted-foreground">
                      LE {video.product.variants[0].price.toFixed(2)}
                      {video.product.variants[0].compareAtPrice && (
                        <span className="line-through ml-2">
                          LE {video.product.variants[0].compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={video.isActive}
                        onCheckedChange={() => handleToggleActive(video.id, video.isActive)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {video.isActive ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shoppable Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Video File</Label>
              <div className="flex gap-2">
                <Input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {videoFile && (
                <p className="text-sm text-muted-foreground">{videoFile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <Input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              />
              {thumbnailFile && (
                <p className="text-sm text-muted-foreground">{thumbnailFile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Linked Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !videoFile || !thumbnailFile || !selectedProductId}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InstagramPostsSection() {
  const { data: postsRes, isLoading } = useInstagramPosts();
  const createMutation = useCreateInstagramPost();
  const updateMutation = useUpdateInstagramPost();
  const deleteMutation = useDeleteInstagramPost();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [altEn, setAltEn] = useState("");

  const posts = postsRes?.data ?? [];

  const handleCreate = async () => {
    if (!imageFile) {
      toast.error("Please select an image");
      return;
    }

    try {
      await createMutation.mutateAsync({
        image: imageFile,
        linkUrl: linkUrl || undefined,
        altEn: altEn || undefined,
        position: posts.length,
        isActive: true,
      });
      toast.success("Post added");
      setShowAddDialog(false);
      setImageFile(null);
      setLinkUrl("");
      setAltEn("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add post");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isActive: !isActive } });
      toast.success(isActive ? "Post hidden" : "Post visible");
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Post deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>909 — FW25 Drops</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">@909</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No images yet. Add your first image above.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`relative group aspect-square rounded-lg overflow-hidden ${!post.isActive ? "opacity-50" : ""}`}
              >
                <img
                  src={post.imageUrl}
                  alt={post.altEn || "Instagram post"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(post.id, post.isActive)}
                    >
                      {post.isActive ? "H" : "S"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Instagram Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Alt Text (English)</Label>
              <Input
                value={altEn}
                onChange={(e) => setAltEn(e.target.value)}
                placeholder="Describe the image"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !imageFile}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
