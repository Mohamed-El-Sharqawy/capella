import { prisma } from "../../lib/prisma";
import type { CouponModel } from "./model";

export abstract class CouponService {
  static async list() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });
  }

  static async getById(id: string) {
    return prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
  }

  static async getByCode(code: string) {
    return prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { _count: { select: { orders: true } } },
    });
  }

  static async create(body: CouponModel["createBody"]) {
    return prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        discountType: body.discountType,
        discountValue: body.discountValue,
        minOrderAmount: body.minOrderAmount,
        maxDiscountAmount: body.maxDiscountAmount,
        usageLimit: body.usageLimit,
        usageLimitPerUser: body.usageLimitPerUser,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive ?? true,
      },
      include: { _count: { select: { orders: true } } },
    });
  }

  static async update(id: string, body: CouponModel["updateBody"]) {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return null;

    const updateData: Record<string, unknown> = {};
    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = body.discountValue;
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount;
    if (body.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = body.maxDiscountAmount;
    if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit;
    if (body.usageLimitPerUser !== undefined) updateData.usageLimitPerUser = body.usageLimitPerUser;
    if (body.startsAt !== undefined) updateData.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    return prisma.coupon.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { orders: true } } },
    });
  }

  static async delete(id: string) {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.coupon.delete({ where: { id } });
    return true;
  }

  static async validate(code: string, orderTotal: number, userId?: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, error: "Coupon not found" };
    }

    if (!coupon.isActive) {
      return { valid: false, error: "Coupon is not active" };
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return { valid: false, error: "Coupon is not yet valid" };
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return { valid: false, error: "Coupon has expired" };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached" };
    }

    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return { valid: false, error: `Minimum order amount is $${coupon.minOrderAmount}` };
    }

    if (userId && coupon.usageLimitPerUser) {
      const userUsageCount = await prisma.order.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsageCount >= coupon.usageLimitPerUser) {
        return { valid: false, error: "You have reached the usage limit for this coupon" };
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      valid: true,
      coupon,
      discountAmount,
      finalTotal: orderTotal - discountAmount,
    };
  }

  static async incrementUsage(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }
}
