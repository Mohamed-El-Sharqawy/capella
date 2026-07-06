import { prisma } from "../../lib/prisma";
import { slugify } from "@ecommerce/shared-utils";
import { StorageService } from "../../lib/storage";
import type { CollectionModel } from "./model";

const COLLECTION_INCLUDE = {
  image: true,
  video: true,
  _count: { select: { productCollections: true } },
} as const;

const COLLECTION_WITH_CHILDREN = {
  image: true,
  video: true,
  _count: { select: { productCollections: true } },
  children: {
    where: { isActive: true },
    include: {
      image: true,
      video: true,
      _count: { select: { productCollections: true } },
    },
    orderBy: { position: "asc" as const },
  },
} as const;

export abstract class CollectionService {
  static async list() {
    const collections = await prisma.collection.findMany({
      where: { parentId: null, isDisplayedOnCollectionsPage: true }, // Only top-level collections visible on collections page
      include: COLLECTION_WITH_CHILDREN,
      orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    });

    // Calculate total products for parent (own + children's)
    return collections.map((col) => {
      const childrenProductCount = col.children.reduce(
        (sum, child) => sum + (child._count?.productCollections ?? 0),
        0
      );
      return {
        ...col,
        _count: {
          products: col._count.productCollections + childrenProductCount,
        },
      };
    });
  }

  static async listAll() {
    // Returns all collections in flat list (for product form dropdown)
    return prisma.collection.findMany({
      include: COLLECTION_INCLUDE,
      orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    });
  }

  static async listForHeader() {
    const collections = await prisma.collection.findMany({
      where: { inHeader: true, isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { position: "asc" },
          select: {
            id: true,
            slug: true,
            nameEn: true,
            nameAr: true,
            _count: { select: { productCollections: true } },
          },
        },
        _count: { select: { productCollections: true } },
      },
      orderBy: { position: "asc" },
    });

    // Calculate total products for parent (own + children's)
    return collections.map((col) => {
      const childrenProductCount = col.children.reduce(
        (sum, child) => sum + (child._count?.productCollections ?? 0),
        0
      );
      return {
        ...col,
        _count: {
          products: col._count.productCollections + childrenProductCount,
        },
      };
    });
  }

  static async getBySlug(slug: string) {
    const result = await prisma.collection.findUnique({
      where: { slug },
      include: {
        ...COLLECTION_INCLUDE,
        productCollections: {
          where: { product: { isActive: true } },
          include: {
            product: {
              include: {
                defaultVariant: {
                  include: { images: { orderBy: { position: "asc" } } },
                },
                hoverVariant: {
                  include: { images: { orderBy: { position: "asc" } } },
                },
                variants: {
                  where: { isActive: true },
                  orderBy: { price: "asc" },
                  take: 1,
                },
                material: true,
              },
            },
          },
          take: 20,
        },
      },
    });

    if (!result) return null;

    const { productCollections, ...rest } = result;
    return {
      ...rest,
      products: productCollections.map((pc: any) => pc.product),
      _count: { products: rest._count.productCollections },
    };
  }

  static async getById(id: string) {
    const result = await prisma.collection.findUnique({
      where: { id },
      include: {
        ...COLLECTION_INCLUDE,
        children: {
          include: {
            _count: { select: { productCollections: true } },
          },
          orderBy: { position: "asc" },
        },
        productCollections: {
          include: {
            product: {
              include: {
                variants: {
                  select: { id: true, price: true, stock: true },
                  take: 5,
                },
              },
            },
          },
        },
      },
    });

    if (!result) return null;

    const { productCollections, children, ...rest } = result;
    return {
      ...rest,
      products: productCollections.map((pc: any) => pc.product),
      _count: { products: rest._count.productCollections },
      children: children.map((child: any) => ({
        ...child,
        _count: { products: child._count.productCollections },
      })),
    };
  }

  static async create(body: CollectionModel["createBody"]) {
    const slug = slugify(body.nameEn);
    const existingSlug = await prisma.collection.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    return prisma.collection.create({
      data: { ...body, slug: finalSlug },
      include: COLLECTION_INCLUDE,
    });
  }

  static async update(id: string, body: CollectionModel["updateBody"]) {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) return null;

    const updateData: Record<string, unknown> = { ...body };
    if (body.nameEn && body.nameEn !== existing.nameEn) {
      const newSlug = slugify(body.nameEn);
      // Check if slug already exists (excluding current collection)
      const existingSlug = await prisma.collection.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      updateData.slug = existingSlug ? `${newSlug}-${Date.now()}` : newSlug;
    }

    return prisma.collection.update({
      where: { id },
      data: updateData,
      include: COLLECTION_INCLUDE,
    });
  }

  static async delete(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { image: true, video: true },
    });
    if (!collection) return null;

    if (collection.image) {
      await StorageService.delete(collection.image.publicId);
    }

    if (collection.video) {
      await StorageService.deleteVideo(collection.video.publicId);
    }

    await prisma.collection.delete({ where: { id } });
    return true;
  }

  // Get collections featured on homepage (for bento grid)
  static async listFeaturedOnHome() {
    return prisma.collection.findMany({
      where: { isFeaturedOnHome: true, isActive: true },
      include: { image: true },
      orderBy: { homeFeaturedPosition: "asc" },
      take: 4, // 4 collections for bento grid layout
    });
  }
}
