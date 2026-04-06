import { prisma } from "../../lib/prisma";

const REVIEW_INCLUDE = {
  product: {
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" as const },
        take: 1,
        include: {
          images: {
            orderBy: { position: "asc" as const },
            take: 1,
            include: { image: true },
          },
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

export abstract class ReviewService {
  static async list(approvedOnly = false) {
    return prisma.review.findMany({
      where: approvedOnly ? { isApproved: true, isActive: true } : undefined,
      include: REVIEW_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  static async listForHomepage(limit = 6) {
    return prisma.review.findMany({
      where: { isApproved: true, isActive: true },
      include: REVIEW_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  static async getById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      include: REVIEW_INCLUDE,
    });
  }

  static async getByProductId(productId: string, userId?: string) {
    // Get approved reviews OR user's own reviews (even if not approved)
    const where = userId
      ? {
          productId,
          isActive: true,
          OR: [
            { isApproved: true },
            { userId, isApproved: false },
          ],
        }
      : { productId, isApproved: true, isActive: true };

    return prisma.review.findMany({
      where,
      include: REVIEW_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  static async hasUserReviewed(productId: string, userId: string) {
    const existing = await prisma.review.findFirst({
      where: { productId, userId },
    });
    return !!existing;
  }

  static async create(data: {
    productId: string;
    userId?: string;
    customerName: string;
    title: string;
    content: string;
    rating: number;
  }) {
    // Check if user already reviewed this product
    if (data.userId) {
      const existing = await prisma.review.findFirst({
        where: { productId: data.productId, userId: data.userId },
      });
      if (existing) {
        throw new Error("You have already reviewed this product");
      }
    }

    return prisma.review.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        customerName: data.customerName,
        title: data.title,
        content: data.content,
        rating: data.rating,
        isApproved: false, // Requires admin approval
      },
      include: REVIEW_INCLUDE,
    });
  }

  static async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      rating?: number;
      isApproved?: boolean;
      isActive?: boolean;
    }
  ) {
    return prisma.review.update({
      where: { id },
      data,
      include: REVIEW_INCLUDE,
    });
  }

  static async delete(id: string) {
    await prisma.review.delete({ where: { id } });
    return true;
  }

  static async approve(id: string) {
    return prisma.review.update({
      where: { id },
      data: { isApproved: true },
      include: REVIEW_INCLUDE,
    });
  }
}
