import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useAllCollections } from "@/features/collections";
import { useColors } from "@/features/colors";
import { useSizes } from "@/features/sizes";
import {
  useProduct,
  useUpdateProduct,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useUploadVariantImages,
  useDeleteVariantImage,
  useUploadSizeGuide,
  useDeleteSizeGuide,
  useProductImages,
  useUploadProductImages,
  useDeleteProductImage,
  useLinkImageToVariant,
  useUnlinkImageFromVariant,
} from "@/features/products";
import type { UpdateProductBody, CreateVariantBody, UpdateVariantBody } from "@/features/products";
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
  id?: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  colorId: string;
  sizeId: string;
  isActive: boolean;
  isNew?: boolean;
}

export function EditProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productRes, isLoading } = useProduct(slug ?? "");
  const product = productRes?.data;

  const updateProductMutation = useUpdateProduct();
  const createVariantMutation = useCreateVariant();
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();
  const uploadImagesMutation = useUploadVariantImages();
  const deleteImageMutation = useDeleteVariantImage();
  const uploadSizeGuideMutation = useUploadSizeGuide();
  const deleteSizeGuideMutation = useDeleteSizeGuide();
  const uploadProductImagesMutation = useUploadProductImages();
  const deleteProductImageMutation = useDeleteProductImage();
  const linkImageMutation = useLinkImageToVariant();
  const unlinkImageMutation = useUnlinkImageFromVariant();

  const { data: productImages } = useProductImages(product?.id ?? "");

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sizeGuideInputRef = useRef<HTMLInputElement>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [linkImageVariantId, setLinkImageVariantId] = useState<string | null>(null);

  const { data: collectionsRes } = useAllCollections();
  const { data: colorsRes } = useColors();
  const { data: sizesRes } = useSizes();

  const collections = collectionsRes?.data ?? [];
  const colors = colorsRes?.data ?? [];
  const sizes = sizesRes?.data ?? [];

  const [isInitialized, setIsInitialized] = useState(false);
  const [showVariantGenerator, setShowVariantGenerator] = useState(false);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [generatorPrice, setGeneratorPrice] = useState("");
  const [generatorCompareAtPrice, setGeneratorCompareAtPrice] = useState("");
  const [generatorStock, setGeneratorStock] = useState("50");
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
  const [variants, setVariants] = useState<VariantForm[]>([]);

  useEffect(() => {
    if (product && !isInitialized) {
      setNameEn(product.nameEn);
      setNameAr(product.nameAr);
      setDescriptionEn(product.descriptionEn);
      setDescriptionAr(product.descriptionAr);
      setShortDescriptionEn(product.shortDescriptionEn ?? "");
      setShortDescriptionAr(product.shortDescriptionAr ?? "");
      setMetaTitleEn(product.metaTitleEn ?? "");
      setMetaTitleAr(product.metaTitleAr ?? "");
      setMetaDescriptionEn(product.metaDescriptionEn ?? "");
      setMetaDescriptionAr(product.metaDescriptionAr ?? "");
      setGender(product.gender as Gender);
      setCollectionId(product.collectionId ?? "");
      setIsActive(product.isActive);
      setIsFeatured(product.isFeatured);
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          nameEn: v.nameEn,
          nameAr: v.nameAr,
          sku: v.sku ?? "",
          price: String(v.price),
          compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
          stock: String(v.stock),
          colorId: v.colorId ?? "",
          sizeId: v.sizeId ?? "",
          isActive: v.isActive,
        }))
      );
      setIsInitialized(true);
    }
  }, [product, isInitialized]);


  const addVariant = () => {
    setVariants([
      ...variants,
      {
        nameEn: "",
        nameAr: "",
        sku: "",
        price: "",
        compareAtPrice: "",
        stock: "0",
        colorId: "",
        sizeId: "",
        isActive: true,
        isNew: true,
      },
    ]);
  };

  const generateVariants = () => {
    if (selectedColorIds.length === 0 || selectedSizeIds.length === 0) {
      toast.error("Please select at least one color and one size");
      return;
    }
    if (!generatorPrice) {
      toast.error("Please enter a price");
      return;
    }

    const newVariants: VariantForm[] = [];
    const existingCombos = new Set(
      variants.map((v) => `${v.colorId}-${v.sizeId}`)
    );

    for (const colorId of selectedColorIds) {
      for (const sizeId of selectedSizeIds) {
        const comboKey = `${colorId}-${sizeId}`;
        if (existingCombos.has(comboKey)) continue;

        const color = colors.find((c) => c.id === colorId);
        const size = sizes.find((s) => s.id === sizeId);
        if (!color || !size) continue;

        newVariants.push({
          nameEn: `${nameEn} - ${color.nameEn} / ${size.nameEn}`,
          nameAr: `${nameAr} - ${color.nameAr} / ${size.nameAr}`,
          sku: `${nameEn.slice(0, 3).toUpperCase()}-${color.nameEn.slice(0, 2).toUpperCase()}-${size.nameEn}-${Date.now().toString().slice(-4)}`,
          price: generatorPrice,
          compareAtPrice: generatorCompareAtPrice,
          stock: generatorStock,
          colorId,
          sizeId,
          isActive: true,
          isNew: true,
        });
      }
    }

    if (newVariants.length === 0) {
      toast.error("All selected combinations already exist");
      return;
    }

    setVariants([...variants, ...newVariants]);
    setShowVariantGenerator(false);
    setSelectedColorIds([]);
    setSelectedSizeIds([]);
    toast.success(`Generated ${newVariants.length} variants`);
  };

  const toggleColorSelection = (colorId: string) => {
    setSelectedColorIds((prev) =>
      prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId]
    );
  };

  const toggleSizeSelection = (sizeId: string) => {
    setSelectedSizeIds((prev) =>
      prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const removeVariant = async (index: number) => {
    const variant = variants[index];
    if (variant.id) {
      if (!confirm("Delete this variant?")) return;
      try {
        await deleteVariantMutation.mutateAsync(variant.id);
        toast.success("Variant deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete variant");
        return;
      }
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleImageUpload = async (variantId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      await uploadImagesMutation.mutateAsync({
        variantId,
        files: Array.from(files),
      });
      toast.success("Images uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload images");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      await deleteImageMutation.mutateAsync(imageId);
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  const getVariantImages = (variantId: string) => {
    const variant = product?.variants.find((v) => v.id === variantId);
    return variant?.images ?? [];
  };

  const handleSizeGuideUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !product) return;
    try {
      await uploadSizeGuideMutation.mutateAsync({
        productId: product.id,
        file: files[0],
      });
      toast.success("Size guide uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload size guide");
    }
  };

  const handleDeleteSizeGuide = async () => {
    if (!product || !confirm("Delete size guide?")) return;
    try {
      await deleteSizeGuideMutation.mutateAsync(product.id);
      toast.success("Size guide deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete size guide");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      const productBody: UpdateProductBody = {
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
      };

      await updateProductMutation.mutateAsync({ id: product.id, body: productBody });

      for (const variant of variants) {
        if (variant.isNew) {
          const body: CreateVariantBody = {
            nameEn: variant.nameEn,
            nameAr: variant.nameAr,
            sku: variant.sku || undefined,
            price: parseFloat(variant.price) || 0,
            compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : undefined,
            stock: parseInt(variant.stock) || 0,
            colorId: variant.colorId || undefined,
            sizeId: variant.sizeId || undefined,
            isActive: variant.isActive,
          };
          await createVariantMutation.mutateAsync({ productId: product.id, body });
        } else if (variant.id) {
          const body: UpdateVariantBody = {
            nameEn: variant.nameEn,
            nameAr: variant.nameAr,
            sku: variant.sku || undefined,
            price: parseFloat(variant.price) || 0,
            compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : undefined,
            stock: parseInt(variant.stock) || 0,
            colorId: variant.colorId || null,
            sizeId: variant.sizeId || null,
            isActive: variant.isActive,
          };
          await updateVariantMutation.mutateAsync({ variantId: variant.id, body });
        }
      }

      // Invalidate queries once after all mutations complete
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      
      toast.success("Product updated");
      navigate("/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product");
    }
  };

  if (isLoading || (product && !isInitialized)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild className="mt-4">
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  const isSaving =
    updateProductMutation.isPending ||
    createVariantMutation.isPending ||
    updateVariantMutation.isPending;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">{product.nameEn}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
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
                    <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Size Guide</Label>
                  <p className="text-xs text-muted-foreground">Upload a size guide image for this product</p>
                  {product.sizeGuideUrl ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={product.sizeGuideUrl}
                        alt="Size Guide"
                        className="h-24 w-auto rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => setPreviewImageUrl(product.sizeGuideUrl ?? null)}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSizeGuide}
                        disabled={deleteSizeGuideMutation.isPending}
                      >
                        {deleteSizeGuideMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload Size Guide</span>
                        <input
                          ref={sizeGuideInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSizeGuideUpload(e.target.files)}
                        />
                      </label>
                    </div>
                  )}
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
                    Upload images once, link to multiple variants
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload new images */}
                <div className="space-y-2">
                  <Label>Upload New Images</Label>
                  <div className="flex gap-2 flex-wrap">
                    <label className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Add Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            try {
                              await uploadProductImagesMutation.mutateAsync({
                                productId: product.id,
                                files: Array.from(e.target.files),
                              });
                              toast.success("Images uploaded");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Failed to upload");
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Product images gallery */}
                <div className="space-y-4">
                  <Label>All Product Images ({productImages?.data?.length ?? 0})</Label>
                  {productImages?.data && productImages.data.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {productImages.data.map((img) => (
                        <div key={img.id} className="border rounded-lg p-3 space-y-3">
                          <div className="relative group">
                            <img
                              src={img.url}
                              alt={img.altEn || "Product image"}
                              className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                              onClick={() => setPreviewImageUrl(img.url)}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={async () => {
                                if (!confirm("Delete this image from all variants?")) return;
                                try {
                                  await deleteProductImageMutation.mutateAsync(img.id);
                                  toast.success("Image deleted");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Failed to delete");
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Linked variants */}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Linked to {img.variantImages?.length ?? 0} variant(s)
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {product.variants.map((variant) => {
                                const isLinked = img.variantImages?.some(
                                  (vi) => vi.variantId === variant.id
                                );
                                return (
                                  <button
                                    key={variant.id}
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        if (isLinked) {
                                          await unlinkImageMutation.mutateAsync({
                                            imageId: img.id,
                                            variantId: variant.id,
                                          });
                                          toast.success("Image unlinked");
                                        } else {
                                          await linkImageMutation.mutateAsync({
                                            imageId: img.id,
                                            variantId: variant.id,
                                          });
                                          toast.success("Image linked");
                                        }
                                      } catch (err) {
                                        toast.error(err instanceof Error ? err.message : "Failed");
                                      }
                                    }}
                                    className={`text-xs px-2 py-1 rounded-full border transition ${
                                      isLinked
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 border-border hover:border-primary"
                                    }`}
                                  >
                                    {variant.color?.nameEn ?? ""} / {variant.size?.nameEn ?? ""}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No images uploaded yet. Upload images above to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            {/* Variant Generator */}
            {showVariantGenerator ? (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-base">Generate Variants (Color × Size)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Colors</Label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => toggleColorSelection(color.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition ${
                            selectedColorIds.includes(color.id)
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Sizes</Label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => toggleSizeSelection(size.id)}
                          className={`px-3 py-1.5 rounded-full border text-sm transition ${
                            selectedSizeIds.includes(size.id)
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {size.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={generatorPrice}
                        onChange={(e) => setGeneratorPrice(e.target.value)}
                        placeholder="e.g. 599"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Compare at Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={generatorCompareAtPrice}
                        onChange={(e) => setGeneratorCompareAtPrice(e.target.value)}
                        placeholder="e.g. 799"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock per Variant</Label>
                      <Input
                        type="number"
                        min="0"
                        value={generatorStock}
                        onChange={(e) => setGeneratorStock(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Will generate {selectedColorIds.length * selectedSizeIds.length} variants
                    ({selectedColorIds.length} colors × {selectedSizeIds.length} sizes)
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" onClick={generateVariants}>
                      Generate Variants
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowVariantGenerator(false);
                        setSelectedColorIds([]);
                        setSelectedSizeIds([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVariantGenerator(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Variants (Color × Size)
                </Button>
              </div>
            )}

            {variants.map((variant, index) => (
              <Card key={variant.id ?? `new-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-base">
                    {variant.isNew ? "New Variant" : `Variant: ${variant.nameEn || index + 1}`}
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

                  {variant.id && !variant.isNew && (
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label>Images</Label>
                        <span className="text-xs text-muted-foreground">Recommended: 337 × 505 px</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {getVariantImages(variant.id).map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.url}
                              alt={img.altEn || variant.nameEn}
                              className="h-20 w-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewImageUrl(img.url)}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteImage(img.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {/* Link existing product images */}
                        <button
                          type="button"
                          onClick={() => setLinkImageVariantId(variant.id!)}
                          className="flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:bg-primary/5 text-primary"
                        >
                          <Plus className="h-5 w-5" />
                          <span className="text-xs mt-1">Link</span>
                        </button>
                        {/* Upload new images */}
                        <label className="flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">Upload</span>
                          <input
                            ref={(el) => {
                              if (variant.id) fileInputRefs.current[variant.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => variant.id && handleImageUpload(variant.id, e.target.files)}
                          />
                        </label>
                      </div>
                    </div>
                  )}
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
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>

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

      {/* Link existing images to variant modal */}
      <Dialog open={!!linkImageVariantId} onOpenChange={() => setLinkImageVariantId(null)}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Link Images to Variant</h3>
              <p className="text-sm text-muted-foreground">
                Select images from the product gallery to link to this variant
              </p>
            </div>

            {productImages?.data && productImages.data.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {productImages.data.map((img) => {
                  const isLinked = img.variantImages?.some(
                    (vi) => vi.variantId === linkImageVariantId
                  );
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={async () => {
                        if (!linkImageVariantId) return;
                        try {
                          if (isLinked) {
                            await unlinkImageMutation.mutateAsync({
                              imageId: img.id,
                              variantId: linkImageVariantId,
                            });
                            toast.success("Image unlinked");
                          } else {
                            await linkImageMutation.mutateAsync({
                              imageId: img.id,
                              variantId: linkImageVariantId,
                            });
                            toast.success("Image linked");
                          }
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed");
                        }
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                        isLinked
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.altEn || "Product image"}
                        className="w-full h-full object-cover"
                      />
                      {isLinked && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <X className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No product images available.</p>
                <p className="text-sm">Go to the Images tab to upload images first.</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setLinkImageVariantId(null)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
