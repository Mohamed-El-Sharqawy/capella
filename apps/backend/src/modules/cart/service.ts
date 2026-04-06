import { prisma } from "../../lib/prisma";
import type { CartModel } from "./model";

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: true,
          images: { orderBy: { position: "asc" as const }, take: 1 },
          color: true,
          size: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export abstract class CartService {
  static async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: CART_INCLUDE,
      });
    }

    return cart;
  }

  static async addItem(userId: string, body: CartModel["addItemBody"]) {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: body.variantId } },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + body.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: body.variantId,
          quantity: body.quantity,
        },
      });
    }

    return prisma.cart.findUnique({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
  }

  static async updateItem(userId: string, itemId: string, body: CartModel["updateItemBody"]) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return null;

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) return null;

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: body.quantity },
    });

    return prisma.cart.findUnique({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
  }

  static async removeItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return null;

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) return null;

    await prisma.cartItem.delete({ where: { id: itemId } });

    return prisma.cart.findUnique({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
  }

  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return null;

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return prisma.cart.findUnique({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
  }
}
