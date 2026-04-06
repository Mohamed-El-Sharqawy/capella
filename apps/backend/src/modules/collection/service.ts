import { prisma } from "../../lib/prisma";
import { slugify } from "@ecommerce/shared-utils";
import { CloudinaryService } from "../../lib/cloudinary";
import type { CollectionModel } from "./model";

const COLLECTION_INCLUDE = {
  image: true,
  _count: { select: { products: true } },
} as const;

const COLLECTION_WITH_CHILDREN = {
  image: true,
  _count: { select: { products: true } },
  children: {
    where: { isActive: true },
    include: {
      image: true,
      _count: { select: { products: true } },
    },
    orderBy: { position: "asc" as const },
  },
} as const;

export abstract class CollectionService {
  static async list() {
    const collections = await prisma.collection.findMany({
      where: { parentId: null }, // Only top-level collections
      include: COLLECTION_WITH_CHILDREN,
      orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    });

    // Calculate total products for parent (own + children's)
    return collections.map((col) => {
      const childrenProductCount = col.children.reduce(
        (sum, child) => sum + (child._count?.products ?? 0),
        0
      );
      return {
        ...col,
        _count: {
          products: col._count.products + childrenProductCount,
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
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { position: "asc" },
    });

    // Calculate total products for parent (own + children's)
    return collections.map((col) => {
      const childrenProductCount = col.children.reduce(
        (sum, child) => sum + (child._count?.products ?? 0),
        0
      );
      return {
        ...col,
        _count: {
          products: col._count.products + childrenProductCount,
        },
      };
    });
  }

  static async getBySlug(slug: string) {
    return prisma.collection.findUnique({
      where: { slug },
      include: {
        ...COLLECTION_INCLUDE,
        products: {
          where: { isActive: true },
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
          },
          take: 20,
        },
      },
    });
  }

  static async getById(id: string) {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        ...COLLECTION_INCLUDE,
        children: {
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { position: "asc" },
        },
        products: {
          include: {
            variants: {
              select: { id: true, price: true, stock: true },
              take: 5,
            },
          },
        },
      },
    });
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
      include: { image: true },
    });
    if (!collection) return null;

    if (collection.image) {
      await CloudinaryService.delete(collection.image.publicId);
    }

    await prisma.collection.delete({ where: { id } });
    return true;
  }

  // Get collections featured on homepage (for hero section)
  static async listFeaturedOnHome() {
    return prisma.collection.findMany({
      where: { isFeaturedOnHome: true, isActive: true },
      include: { image: true },
      orderBy: { homeFeaturedPosition: "asc" },
      take: 5, // Up to 5 collections: 2 on top row, 3 on bottom row
    });
  }
}
