import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";
import { useProduct } from "@/features/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ViewProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: response, isLoading } = useProduct(slug ?? "");
  const product = response?.data;
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  if (isLoading) {
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

  const getLowestPrice = () => {
    if (!product.variants.length) return 0;
    return Math.min(...product.variants.map((v) => v.price));
  };

  const getTotalStock = () => {
    return product.variants.reduce((sum, v) => sum + v.stock, 0);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.nameEn}</h1>
            <p className="text-muted-foreground">{product.nameAr}</p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/products/${product.slug}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Product
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        <Badge variant={product.isActive ? "default" : "secondary"}>
          {product.isActive ? "Active" : "Draft"}
        </Badge>
        {product.isFeatured && <Badge variant="outline">Featured</Badge>}
        <Badge variant="outline">{product.gender}</Badge>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants ({product.variants.length})</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Starting Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${getLowestPrice().toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{getTotalStock()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {(product as { collection?: { nameEn: string } }).collection?.nameEn ?? "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">English</p>
                <p className="whitespace-pre-wrap">{product.descriptionEn || "—"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Arabic</p>
                <p className="whitespace-pre-wrap" dir="rtl">{product.descriptionAr || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {(product.shortDescriptionEn || product.shortDescriptionAr) && (
            <Card>
              <CardHeader>
                <CardTitle>Short Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">English</p>
                  <p>{product.shortDescriptionEn || "—"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Arabic</p>
                  <p dir="rtl">{product.shortDescriptionAr || "—"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {product.sizeGuideUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Size Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={product.sizeGuideUrl}
                  alt="Size Guide"
                  className="max-w-full h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewImageUrl(product.sizeGuideUrl ?? null)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          {product.variants.map((variant) => (
            <Card key={variant.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{variant.nameEn}</CardTitle>
                  <Badge variant={variant.isActive ? "default" : "secondary"}>
                    {variant.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{variant.nameAr}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-mono">{variant.sku || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold">${variant.price.toFixed(2)}</p>
                    {variant.compareAtPrice && (
                      <p className="text-sm text-muted-foreground line-through">
                        ${variant.compareAtPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock</p>
                    <p className={variant.stock === 0 ? "text-destructive" : ""}>
                      {variant.stock}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color / Size</p>
                    <p>
                      {variant.color?.nameEn || "—"} / {variant.size?.nameEn || "—"}
                    </p>
                  </div>
                </div>

                {variant.images && variant.images.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Images</p>
                    <div className="flex gap-2 flex-wrap">
                      {variant.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt={img.altEn || variant.nameEn}
                          className="h-20 w-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImageUrl(img.url)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Title</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">English</p>
                <p>{product.metaTitleEn || "—"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Arabic</p>
                <p dir="rtl">{product.metaTitleAr || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">English</p>
                <p>{product.metaDescriptionEn || "—"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Arabic</p>
                <p dir="rtl">{product.metaDescriptionAr || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
