import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useAllCollections } from "@/features/collections";
import { useColors } from "@/features/colors";
import { useSizes } from "@/features/sizes";
import {
  useCreateProduct,
  useUploadProductImages,
  useLinkImageToVariants,
} from "@/features/products";
import type { CreateVariantBody } from "@/features/products";
import { Gender } from "@ecommerce/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

interface VariantForm {
  tempId: string; // Temporary ID for tracking before creation
  nameEn: string;
  nameAr: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  colorId: string;
  sizeId: string;
  isActive: boolean;
}

// Staged image with file and linked variant tempIds
interface StagedImage {
  id: string;
  file: File;
  previewUrl: string;
  linkedVariantTempIds: string[];
}

const createEmptyVariant = (): VariantForm => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  nameEn: "",
  nameAr: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  colorId: "",
  sizeId: "",
  isActive: true,
});

export function NewProductPage() {
  const navigate = useNavigate();
  const createMutation = useCreateProduct();
  const uploadProductImagesMutation = useUploadProductImages();
  const linkImageToVariantsMutation = useLinkImageToVariants();

  const { data: collectionsRes } = useAllCollections();
  const { data: colorsRes } = useColors();
  const { data: sizesRes } = useSizes();

  const collections = collectionsRes?.data ?? [];
  const colors = colorsRes?.data ?? [];
  const sizes = sizesRes?.data ?? [];

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [shortDescriptionEn, setShortDescriptionEn] = useState("");
  const [shortDescriptionAr, setShortDescriptionAr] = useState("");
  const [metaTitleEn, setMetaTitleEn] = useState("");
  const [metaTitleAr, setMetaTitleAr] = useState("");
  const [metaDescriptionEn, setMetaDescriptionEn] = useState("");
  const [metaDescriptionAr, setMetaDescriptionAr] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.UNISEX);
  const [collectionId, setCollectionId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [variants, setVariants] = useState<VariantForm[]>([createEmptyVariant()]);

  // Staged images (before product creation)
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  const addVariant = () => {
    setVariants([...variants, createEmptyVariant()]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) return;
    const removedTempId = variants[index].tempId;
    setVariants(variants.filter((_, i) => i !== index));
    // Remove this variant from all staged images
    setStagedImages((prev) =>
      prev.map((img) => ({
        ...img,
        linkedVariantTempIds: img.linkedVariantTempIds.filter((id) => id !== removedTempId),
      }))
    );
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Add staged images
  const handleAddStagedImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages: StagedImage[] = Array.from(files).map((file) => ({
      id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      linkedVariantTempIds: [], // Not linked to any variant yet
    }));
    setStagedImages((prev) => [...prev, ...newImages]);
  };

  // Remove staged image
  const removeStagedImage = (imageId: string) => {
    setStagedImages((prev) => {
      const img = prev.find((i) => i.id === imageId);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== imageId);
    });
  };

  // Toggle variant link for a staged image
  const toggleImageVariantLink = (imageId: string, variantTempId: string) => {
    setStagedImages((prev) =>
      prev.map((img) => {
        if (img.id !== imageId) return img;
        const isLinked = img.linkedVariantTempIds.includes(variantTempId);
        return {
          ...img,
          linkedVariantTempIds: isLinked
            ? img.linkedVariantTempIds.filter((id) => id !== variantTempId)
            : [...img.linkedVariantTempIds, variantTempId],
        };
      })
    );
  };

  // Get images linked to a specific variant
  const getVariantStagedImages = (variantTempId: string) => {
    return stagedImages.filter((img) => img.linkedVariantTempIds.includes(variantTempId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn || !nameAr) {
      toast.error("Product name is required in both languages");
      return;
    }

    const validVariants = variants.filter((v) => v.nameEn && v.price);
    if (validVariants.length === 0) {
      toast.error("At least one variant with name and price is required");
      return;
    }

    const variantsData: CreateVariantBody[] = validVariants.map((v) => ({
      nameEn: v.nameEn,
      nameAr: v.nameAr,
      sku: v.sku || undefined,
      price: parseFloat(v.price) || 0,
      compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : undefined,
      stock: parseInt(v.stock) || 0,
      colorId: v.colorId || undefined,
      sizeId: v.sizeId || undefined,
      isActive: v.isActive,
    }));

    setIsSubmitting(true);
    
    // Show persistent loading toast
    const loadingToastId = toast.loading("Creating product...", {
      description: "Please wait, do not leave this page",
    });

    try {
      // Step 1: Create product with variants
      const result = await createMutation.mutateAsync({
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr,
        shortDescriptionEn: shortDescriptionEn || undefined,
        shortDescriptionAr: shortDescriptionAr || undefined,
        metaTitleEn: metaTitleEn || undefined,
        metaTitleAr: metaTitleAr || undefined,
        metaDescriptionEn: metaDescriptionEn || undefined,
        metaDescriptionAr: metaDescriptionAr || undefined,
        gender,
        collectionId: collectionId || undefined,
        isActive,
        isFeatured,
        variants: variantsData,
      });

      const createdProduct = result.data;
      if (!createdProduct) throw new Error("Product creation failed");

      toast.dismiss(loadingToastId);
      toast.success("Product created!");

      // Step 2: Upload images and link to variants
      if (stagedImages.length > 0) {
        toast.loading("Uploading images...", {
          id: loadingToastId,
          description: `Uploading ${stagedImages.length} image(s), please wait`,
        });

        // Build mapping from tempId to real variant ID
        const tempIdToRealId: Record<string, string> = {};
        validVariants.forEach((v, index) => {
          const realVariant = createdProduct.variants[index];
          if (realVariant) {
            tempIdToRealId[v.tempId] = realVariant.id;
          }
        });

        // Upload each image and link to its variants
        for (const stagedImg of stagedImages) {
          try {
            // Upload image to product
            const uploadResult = await uploadProductImagesMutation.mutateAsync({
              productId: createdProduct.id,
              files: [stagedImg.file],
            });

            const uploadedImage = uploadResult.data?.[0];
            if (!uploadedImage) continue;

            // Link to variants
            const realVariantIds = stagedImg.linkedVariantTempIds
              .map((tempId) => tempIdToRealId[tempId])
              .filter(Boolean);

            if (realVariantIds.length > 0) {
              await linkImageToVariantsMutation.mutateAsync({
                imageId: uploadedImage.id,
                variantIds: realVariantIds,
              });
            }
          } catch (imgErr) {
            console.error("Failed to upload/link image:", imgErr);
          }
        }

        toast.dismiss(loadingToastId);
        toast.success("Images uploaded and linked!");
      }

      navigate(`/products/${createdProduct.slug}`);
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-muted-foreground">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images ({stagedImages.length})</TabsTrigger>
            <TabsTrigger value="variants">Variants ({variants.length})</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">Name (English) *</Label>
                    <Input
                      id="nameEn"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">Name (Arabic) *</Label>
                    <Input
                      id="nameAr"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      dir="rtl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">Description (English)</Label>
                    <Textarea
                      id="descriptionEn"
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                    <Textarea
                      id="descriptionAr"
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                      dir="rtl"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shortDescriptionEn">Short Description (English)</Label>
                    <Textarea
                      id="shortDescriptionEn"
                      value={shortDescriptionEn}
                      onChange={(e) => setShortDescriptionEn(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortDescriptionAr">Short Description (Arabic)</Label>
                    <Textarea
                      id="shortDescriptionAr"
                      value={shortDescriptionAr}
                      onChange={(e) => setShortDescriptionAr(e.target.value)}
                      dir="rtl"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collection</Label>
                    <Select
                      value={collectionId || "none"}
                      onValueChange={(v) => setCollectionId(v === "none" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select collection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Collection</SelectItem>
                        {collections
                          .filter((c: any) => !c.parentId)
                          .map((parent: any) => {
                            const children = collections.filter((c: any) => c.parentId === parent.id);
                            return (
                              <div key={parent.id}>
                                <SelectItem value={parent.id} className="font-medium">
                                  {parent.nameEn}
                                </SelectItem>
                                {children.map((child: any) => (
                                  <SelectItem key={child.id} value={child.id} className="pl-6 text-muted-foreground">
                                    └ {child.nameEn}
                                  </SelectItem>
                                ))}
                              </div>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Gender.MEN}>Men</SelectItem>
                        <SelectItem value={Gender.WOMEN}>Women</SelectItem>
                        <SelectItem value={Gender.UNISEX}>Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isFeatured"
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                    />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Product Images</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Upload images and link to variants before creating
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload new images */}
                <div className="space-y-2">
                  <Label>Upload Images</Label>
                  <div className="flex gap-2 flex-wrap">
                    {stagedImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.previewUrl}
                          alt="Staged"
                          className="h-24 w-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImageUrl(img.previewUrl)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeStagedImage(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="absolute bottom-1 left-1 right-1 text-center">
                          <span className="text-xs bg-black/60 text-white px-1 rounded">
                            {img.linkedVariantTempIds.length} variant(s)
                          </span>
                        </div>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Add Images</span>
                      <input
                        ref={productImageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleAddStagedImages(e.target.files)}
                      />
                    </label>
                  </div>
                </div>

                {/* Link images to variants */}
                {stagedImages.length > 0 && (
                  <div className="space-y-4">
                    <Label>Link Images to Variants</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {stagedImages.map((img) => (
                        <div key={img.id} className="border rounded-lg p-3 space-y-3">
                          <img
                            src={img.previewUrl}
                            alt="Staged"
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Link to variants:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {variants.filter(v => v.nameEn).map((variant) => {
                                const isLinked = img.linkedVariantTempIds.includes(variant.tempId);
                                const colorName = colors.find(c => c.id === variant.colorId)?.nameEn;
                                const sizeName = sizes.find(s => s.id === variant.sizeId)?.nameEn;
                                const label = colorName && sizeName 
                                  ? `${colorName} / ${sizeName}`
                                  : variant.nameEn || `Variant`;
                                return (
                                  <button
                                    key={variant.tempId}
                                    type="button"
                                    onClick={() => toggleImageVariantLink(img.id, variant.tempId)}
                                    className={`text-xs px-2 py-1 rounded-full border transition ${
                                      isLinked
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 border-border hover:border-primary"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                            {variants.filter(v => v.nameEn).length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                Add variants first to link images
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stagedImages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No images added yet. Upload images above to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            {variants.map((variant, index) => (
              <Card key={variant.tempId}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-base">
                    Variant {index + 1}
                    {getVariantStagedImages(variant.tempId).length > 0 && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({getVariantStagedImages(variant.tempId).length} images)
                      </span>
                    )}
                  </CardTitle>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name (English) *</Label>
                      <Input
                        value={variant.nameEn}
                        onChange={(e) => updateVariant(index, "nameEn", e.target.value)}
                        placeholder="e.g. Red / Large"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (Arabic) *</Label>
                      <Input
                        value={variant.nameAr}
                        onChange={(e) => updateVariant(index, "nameAr", e.target.value)}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, "sku", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, "price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Compare at Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.compareAtPrice}
                        onChange={(e) => updateVariant(index, "compareAtPrice", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, "stock", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select
                        value={variant.colorId || "none"}
                        onValueChange={(v) => updateVariant(index, "colorId", v === "none" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Color</SelectItem>
                          {colors.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-4 w-4 rounded-full border"
                                  style={{ backgroundColor: c.hex }}
                                />
                                {c.nameEn}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select
                        value={variant.sizeId || "none"}
                        onValueChange={(v) => updateVariant(index, "sizeId", v === "none" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Size</SelectItem>
                          {sizes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end pb-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={variant.isActive}
                          onCheckedChange={(v) => updateVariant(index, "isActive", v)}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={addVariant} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitleEn">Meta Title (English)</Label>
                    <Input
                      id="metaTitleEn"
                      value={metaTitleEn}
                      onChange={(e) => setMetaTitleEn(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaTitleAr">Meta Title (Arabic)</Label>
                    <Input
                      id="metaTitleAr"
                      value={metaTitleAr}
                      onChange={(e) => setMetaTitleAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaDescriptionEn">Meta Description (English)</Label>
                    <Textarea
                      id="metaDescriptionEn"
                      value={metaDescriptionEn}
                      onChange={(e) => setMetaDescriptionEn(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescriptionAr">Meta Description (Arabic)</Label>
                    <Textarea
                      id="metaDescriptionAr"
                      value={metaDescriptionAr}
                      onChange={(e) => setMetaDescriptionAr(e.target.value)}
                      dir="rtl"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link to="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>

      {/* Image preview dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={() => setPreviewImageUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
