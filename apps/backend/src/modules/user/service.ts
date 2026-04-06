import { prisma } from "../../lib/prisma";
import type { UserModel } from "./model";
import { PAGINATION_DEFAULTS } from "@ecommerce/shared-utils";

export abstract class UserService {
  static async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  static async updateProfile(userId: string, data: UserModel["updateProfile"]) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
      },
    });
  }

  static async listUsers(page: number = PAGINATION_DEFAULTS.PAGE, limit: number = PAGINATION_DEFAULTS.LIMIT) {
    const take = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (page - 1) * take;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return { data: users, total, page, limit: take, totalPages: Math.ceil(total / take) };
  }

  // Address CRUD
  static async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  static async createAddress(userId: string, data: UserModel["createAddress"]) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: { ...data, userId },
    });
  }

  static async updateAddress(userId: string, addressId: string, data: UserModel["updateAddress"]) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) return null;

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  static async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) return null;

    await prisma.address.delete({ where: { id: addressId } });
    return true;
  }

  // Admin: Get user details with orders and analytics events
  static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        addresses: {
          select: {
            id: true,
            label: true,
            street: true,
            city: true,
            state: true,
            country: true,
          },
          orderBy: { isDefault: "desc" },
        },
        orders: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                productNameEn: true,
                variantNameEn: true,
                quantity: true,
                price: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        analyticsEvents: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            data: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    return user;
  }
}
