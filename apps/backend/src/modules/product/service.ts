import { prisma } from "../../lib/prisma";
import { slugify } from "@ecommerce/shared-utils";
import { PAGINATION_DEFAULTS } from "@ecommerce/shared-utils";
import { CloudinaryService } from "../../lib/cloudinary";
import type { ProductModel } from "./model";

const VARIANT_WITH_IMAGES = {
  include: {
    images: {
      orderBy: { position: "asc" as const },
      include: { image: true },
    },
    color: true,
    size: true,
  },
} as const;

const PRODUCT_INCLUDE = {
  variants: {
    ...VARIANT_WITH_IMAGES,
    orderBy: { createdAt: "asc" as const },
  },
  defaultVariant: VARIANT_WITH_IMAGES,
  hoverVariant: VARIANT_WITH_IMAGES,
  collection: true,
  images: true, // Product-level images
} as const;

// Helper to flatten variant images for frontend
function flattenVariantImages(variant: {
  images: Array<{
    id: string;
    imageId: string;
    position: number;
    image: { url: string; publicId: string; altEn: string | null; altAr: string | null };
  }>;
}) {
  return variant.images.map((link) => ({
    id: link.id,
    imageId: link.imageId,
    url: link.image.url,
    publicId: link.image.publicId,
    altEn: link.image.altEn,
    altAr: link.image.altAr,
    position: link.position,
  }));
}

// Transform product to flatten variant images
function transformProduct(product: any) {
  if (!product) return null;
  return {
    ...product,
    variants: product.variants?.map((v: any) => ({
      ...v,
      images: flattenVariantImages(v),
    })),
    defaultVariant: product.defaultVariant
      ? { ...product.defaultVariant, images: flattenVariantImages(product.defaultVariant) }
      : null,
    hoverVariant: product.hoverVariant
      ? { ...product.hoverVariant, images: flattenVariantImages(product.hoverVariant) }
      : null,
  };
}

export abstract class ProductService {
  static async list(query: ProductModel["listQuery"]) {
    const page = Number(query.page) || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      Number(query.limit) || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.gender) where.gender = query.gender;
    
    // Support both collectionId and collectionSlug for better SEO
    // When selecting a parent collection, also include products from child collections
    if (query.collectionSlug) {
      const collection = await prisma.collection.findUnique({
        where: { slug: query.collectionSlug },
        select: { id: true, children: { select: { id: true } } },
      });
      if (collection) {
        // Get all collection IDs (parent + children)
        const collectionIds = [collection.id, ...collection.children.map((c) => c.id)];
        where.collectionId = { in: collectionIds };
      }
    } else if (query.collectionId) {
      // Fetch children for this collection too
      const collection = await prisma.collection.findUnique({
        where: { id: query.collectionId },
        select: { id: true, children: { select: { id: true } } },
      });
      if (collection) {
        const collectionIds = [collection.id, ...collection.children.map((c) => c.id)];
        where.collectionId = { in: collectionIds };
      } else {
        where.collectionId = query.collectionId;
      }
    }
    if (query.isActive !== undefined) where.isActive = query.isActive === "true";
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured === "true";
    if (query.search) {
      where.OR = [
        { nameEn: { contains: query.search, mode: "insensitive" } },
        { nameAr: { contains: query.search, mode: "insensitive" } },
        { descriptionEn: { contains: query.search, mode: "insensitive" } },
        { descriptionAr: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.minPrice || query.maxPrice) {
      where.variants = {
        some: {
          price: {
            ...(query.minPrice ? { gte: Number(query.minPrice) } : {}),
            ...(query.maxPrice ? { lte: Number(query.maxPrice) } : {}),
          },
        },
      };
    }

    const isPriceSorting = query.sortBy === "price";
    const orderBy: Record<string, string> = {};
    
    if (!isPriceSorting) {
      orderBy[query.sortBy || "createdAt"] = query.sortOrder || "desc";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        skip: isPriceSorting ? 0 : skip,
        take: isPriceSorting ? undefined : limit,
        orderBy: isPriceSorting ? undefined : orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    let transformedProducts = products.map(transformProduct);

    // Handle price sorting in JavaScript since Prisma can't sort by nested variant price
    if (isPriceSorting) {
      transformedProducts.sort((a, b) => {
        const priceA = a.variants?.[0]?.price ?? 0;
        const priceB = b.variants?.[0]?.price ?? 0;
        return query.sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      });
      // Apply pagination after sorting
      transformedProducts = transformedProducts.slice(skip, skip + limit);
    }

    return {
      data: transformedProducts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });
    return transformProduct(product);
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    return transformProduct(product);
  }

  static async create(body: ProductModel["createBody"]) {
    const slug = slugify(body.nameEn);

    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const { variants, ...productData } = body;

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug: finalSlug,
        variants: variants
          ? {
              create: variants.map((v) => ({
                ...v,
                slug: slugify(`${body.nameEn}-${v.nameEn}-${Date.now()}`),
                stock: v.stock ?? 0,
              })),
            }
          : undefined,
      },
      include: PRODUCT_INCLUDE,
    });

    return transformProduct(product);
  }

  static async update(id: string, body: ProductModel["updateBody"]) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return null;

    const updateData: Record<string, unknown> = { ...body };
    if (body.nameEn) {
      updateData.slug = slugify(body.nameEn);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: PRODUCT_INCLUDE,
    });
    return transformProduct(product);
  }

  static async delete(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true, // Product-level images
      },
    });
    if (!product) return null;

    // Collect all Cloudinary public IDs from product images + size guide
    const publicIds = [
      ...product.images.map((img) => img.publicId),
      ...(product.sizeGuidePublicId ? [product.sizeGuidePublicId] : []),
    ];

    // Delete from Cloudinary
    if (publicIds.length > 0) {
      await CloudinaryService.deleteMultiple(publicIds);
    }

    // Cascade delete will handle ProductImage, ProductVariantImage, and ProductVariant
    await prisma.product.delete({ where: { id } });
    return true;
  }

  // Variant CRUD
  static async createVariant(productId: string, body: ProductModel["createVariantBody"]) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return null;

    const slug = slugify(`${product.nameEn}-${body.nameEn}-${Date.now()}`);

    return prisma.productVariant.create({
      data: {
        ...body,
        slug,
        stock: body.stock ?? 0,
        productId,
      },
      include: { images: { orderBy: { position: "asc" } } },
    });
  }

  static async updateVariant(variantId: string, body: ProductModel["updateVariantBody"]) {
    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!existing) return null;

    const updateData: Record<string, unknown> = { ...body };
    if (body.nameEn) {
      updateData.slug = slugify(`${existing.product.nameEn}-${body.nameEn}-${Date.now()}`);
    }

    return prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
      include: { images: { orderBy: { position: "asc" } } },
    });
  }

  static async deleteVariant(variantId: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { images: { include: { image: true } } },
    });
    if (!variant) return null;

    // Delete the variant (cascade will remove ProductVariantImage links)
    await prisma.productVariant.delete({ where: { id: variantId } });

    // Check if any images are now orphaned (not linked to any other variant)
    for (const link of variant.images) {
      const otherLinks = await prisma.productVariantImage.count({
        where: { imageId: link.imageId },
      });
      if (otherLinks === 0) {
        // No other variants use this image, delete from Cloudinary
        await CloudinaryService.delete(link.image.publicId);
        await prisma.productImage.delete({ where: { id: link.imageId } });
      }
    }

    return true;
  }

  /**
   * Get related products based on collection IDs
   * Fetches products from the same collections, excluding specified product IDs
   * Falls back to featured products if not enough related products found
   */
  static async getRelatedProducts(options: {
    collectionIds: string[];
    excludeProductIds: string[];
    limit?: number;
  }) {
    const { collectionIds, excludeProductIds, limit = 4 } = options;

    let products: any[] = [];

    if (collectionIds.length > 0) {
      // Get all collection IDs including parent collections
      const collections = await prisma.collection.findMany({
        where: { id: { in: collectionIds } },
        select: { id: true, parentId: true },
      });

      // Collect all relevant collection IDs (original + parents)
      const allCollectionIds = new Set<string>(collectionIds);
      for (const col of collections) {
        if (col.parentId) {
          allCollectionIds.add(col.parentId);
        }
      }

      // Fetch products from these collections
      const relatedProducts = await prisma.product.findMany({
        where: {
          collectionId: { in: Array.from(allCollectionIds) },
          id: { notIn: excludeProductIds },
          isActive: true,
        },
        include: PRODUCT_INCLUDE,
        take: limit * 2, // Fetch more to have options after filtering
        orderBy: { createdAt: "desc" },
      });

      products = relatedProducts.map(transformProduct);
    }

    // If not enough products, fill with featured products
    if (products.length < limit) {
      const existingIds = [...excludeProductIds, ...products.map((p) => p.id)];
      const featuredProducts = await prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
          isActive: true,
          isFeatured: true,
        },
        include: PRODUCT_INCLUDE,
        take: limit - products.length,
        orderBy: { createdAt: "desc" },
      });

      products = [...products, ...featuredProducts.map(transformProduct)];
    }

    // If still not enough, get any active products
    if (products.length < limit) {
      const existingIds = [...excludeProductIds, ...products.map((p) => p.id)];
      const anyProducts = await prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
          isActive: true,
        },
        include: PRODUCT_INCLUDE,
        take: limit - products.length,
        orderBy: { createdAt: "desc" },
      });

      products = [...products, ...anyProducts.map(transformProduct)];
    }

    return products.slice(0, limit);
  }
}
