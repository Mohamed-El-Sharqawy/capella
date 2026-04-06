import { prisma } from "../../lib/prisma";

const FAVOURITE_INCLUDE = {
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

export abstract class FavouriteService {
  static async list(userId: string) {
    return prisma.favourite.findMany({
      where: { userId },
      include: FAVOURITE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  static async add(userId: string, productId: string) {
    const existing = await prisma.favourite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) return existing;

    return prisma.favourite.create({
      data: { userId, productId },
      include: FAVOURITE_INCLUDE,
    });
  }

  static async remove(userId: string, productId: string) {
    const existing = await prisma.favourite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) return null;

    await prisma.favourite.delete({
      where: { userId_productId: { userId, productId } },
    });
    return true;
  }

  static async check(userId: string, productId: string) {
    const existing = await prisma.favourite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!existing;
  }
}
