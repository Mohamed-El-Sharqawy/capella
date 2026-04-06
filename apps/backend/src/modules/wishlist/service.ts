import { prisma } from "../../lib/prisma";
import type { WishlistModel } from "./model";

const WISHLIST_INCLUDE = {
  product: {
    include: {
      images: { orderBy: { createdAt: "asc" as const }, take: 1 },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" as const },
        take: 1,
        include: {
          images: {
            orderBy: { position: "asc" as const },
            take: 1,
            include: { image: true },
          },
          color: true,
          size: true,
        },
      },
    },
  },
} as const;

export abstract class WishlistService {
  static async list(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: WISHLIST_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  static async add(userId: string, body: WishlistModel["addBody"]) {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId: body.productId } },
    });
    if (existing) return existing;

    return prisma.wishlist.create({
      data: { userId, productId: body.productId, note: body.note },
      include: WISHLIST_INCLUDE,
    });
  }

  static async update(userId: string, productId: string, body: WishlistModel["updateBody"]) {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) return null;

    return prisma.wishlist.update({
      where: { userId_productId: { userId, productId } },
      data: { note: body.note },
      include: WISHLIST_INCLUDE,
    });
  }

  static async remove(userId: string, productId: string) {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) return null;

    await prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });
    return true;
  }
}
