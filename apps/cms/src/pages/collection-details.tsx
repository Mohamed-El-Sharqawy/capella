import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

interface CollectionDetails {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  inHeader: boolean;
  position: number;
  isActive: boolean;
  image?: { url: string; altEn?: string };
  _count?: { products: number };
  products?: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    slug: string;
    isActive: boolean;
    isFeatured: boolean;
    variants?: Array<{
      id: string;
      price: number;
      stock: number;
    }>;
  }>;
  children?: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    slug: string;
    _count?: { products: number };
  }>;
}

async function fetchCollectionDetails(id: string): Promise<CollectionDetails | null> {
  try {
    const data = await api.get<{ data: CollectionDetails }>(`/api/collections/${id}`);
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export function CollectionDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: collection, isLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => fetchCollectionDetails(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Collection not found.</p>
        <Button asChild className="mt-4">
          <Link to="/collections">Back to Collections</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/collections">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{collection.nameEn}</h1>
          <p className="text-muted-foreground">{collection.nameAr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Collection Image */}
        <div className="md:col-span-1">
          {collection.image?.url ? (
            <img
              src={collection.image.url}
              alt={collection.image.altEn || collection.nameEn}
              className="w-full aspect-square object-cover rounded-lg"
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Collection Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-mono text-sm">{collection.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={collection.isActive ? "default" : "secondary"}>
                {collection.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Header</p>
              <Badge variant={collection.inHeader ? "default" : "outline"}>
                {collection.inHeader ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Position</p>
              <p>{collection.position}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{collection._count?.products ?? 0}</p>
            </div>
          </div>

          {collection.descriptionEn && (
            <div>
              <p className="text-sm text-muted-foreground">Description (EN)</p>
              <p className="text-sm">{collection.descriptionEn}</p>
            </div>
          )}
          {collection.descriptionAr && (
            <div>
              <p className="text-sm text-muted-foreground">Description (AR)</p>
              <p className="text-sm" dir="rtl">{collection.descriptionAr}</p>
            </div>
          )}
        </div>
      </div>

      {/* Child Collections */}
      {collection.children && collection.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sub-Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {collection.children.map((child) => (
              <Link
                key={child.id}
                to={`/collections/${child.id}`}
                className="p-4 border rounded-lg hover:bg-muted/50 transition"
              >
                <p className="font-medium">{child.nameEn}</p>
                <p className="text-sm text-muted-foreground">{child.nameAr}</p>
                <Badge variant="outline" className="mt-2">
                  {child._count?.products ?? 0} products
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Linked Products</h2>
        {collection.products && collection.products.length > 0 ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (AR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collection.products.map((product) => {
                  const firstVariant = product.variants?.[0];
                  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/products/${product.slug}`}
                          className="hover:underline"
                        >
                          {product.nameEn}
                        </Link>
                      </TableCell>
                      <TableCell>{product.nameAr}</TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.isFeatured ? (
                          <Badge variant="default">Featured</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {firstVariant ? `LE ${firstVariant.price.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={totalStock > 0 ? "secondary" : "destructive"}>
                          {totalStock}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No products linked to this collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
