import { prisma } from "../../lib/prisma";
import { PAGINATION_DEFAULTS } from "@ecommerce/shared-utils";
import type { OrderModel } from "./model";

const ORDER_INCLUDE = {
  items: true,
  user: {
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  },
  address: true,
} as const;

export abstract class OrderService {
  static async list(
    query: OrderModel["listQuery"],
    userId?: string | null,
    isAdmin = false
  ) {
    const page = Number(query.page) || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      Number(query.limit) || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = isAdmin ? {} : { userId };
    if (query.status) where.status = query.status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string, userId?: string | null, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!order) return null;
    if (!isAdmin && order.userId !== userId) return null;

    return order;
  }

  static async create(body: OrderModel["createBody"], userId?: string | null) {
    const variantIds = body.items.map((item) => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: true,
        images: { 
          orderBy: { position: "asc" as const }, 
          take: 1,
          include: { image: true },
        },
        color: true,
        size: true,
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let total = 0;
    const orderItems = body.items.map((item) => {
      const variant = variantMap.get(item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      const itemTotal = variant.price * item.quantity;
      total += itemTotal;

      const imageUrl = variant.images[0]?.image?.url ?? null;

      return {
        variantId: variant.id,
        productNameEn: variant.product.nameEn,
        productNameAr: variant.product.nameAr,
        variantNameEn: variant.nameEn,
        variantNameAr: variant.nameAr,
        sku: variant.sku,
        quantity: item.quantity,
        price: variant.price,
        size: variant.size?.nameEn ?? null,
        color: variant.color?.nameEn ?? null,
        imageUrl,
      };
    });

    // Add shipping cost and apply discount
    const shippingCost = body.shippingCost ?? 0;
    const discountAmount = body.discountAmount ?? 0;
    const grandTotal = total - discountAmount + shippingCost;

    // If guest order, create or find guest user
    let finalUserId = userId;
    if (!userId && body.guestEmail) {
      // Check if guest user already exists
      let guestUser = await prisma.user.findUnique({
        where: { email: body.guestEmail },
      });

      if (!guestUser) {
        // Create new guest user
        guestUser = await prisma.user.create({
          data: {
            email: body.guestEmail,
            firstName: body.guestFirstName || body.shippingFirstName,
            lastName: body.guestLastName || body.shippingLastName,
            phone: body.guestPhone || body.shippingPhone,
            role: "GUEST" as any,
          } as any,
        });
      }
      finalUserId = guestUser.id;
    }

    // If coupon code is provided, validate and get coupon ID
    let couponId: string | undefined;
    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: body.couponCode },
      });
      if (coupon) {
        couponId = coupon.id;
        // Increment coupon usage count
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: finalUserId ?? undefined,
        total: grandTotal,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        couponId: couponId,
        guestEmail: body.guestEmail,
        guestFirstName: body.guestFirstName,
        guestLastName: body.guestLastName,
        guestPhone: body.guestPhone,
        addressId: body.addressId,
        shippingFirstName: body.shippingFirstName,
        shippingLastName: body.shippingLastName,
        shippingStreet: body.shippingStreet,
        shippingCity: body.shippingCity,
        shippingState: body.shippingState,
        shippingZipCode: body.shippingZipCode,
        shippingCountry: body.shippingCountry,
        shippingPhone: body.shippingPhone,
        note: body.note,
        items: { create: orderItems },
      },
      include: ORDER_INCLUDE,
    });

    return order;
  }

  static async updateStatus(id: string, statusValue: string) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.order.update({
      where: { id },
      data: { status: statusValue as never },
      include: ORDER_INCLUDE,
    });
  }
}
