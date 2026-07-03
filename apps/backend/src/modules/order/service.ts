import { prisma } from "../../lib/prisma";
import { PAGINATION_DEFAULTS, getShippingCost } from "@ecommerce/shared-utils";
import { EmailService } from "../email/service";
import { sendMetaEvent } from "../../lib/meta-capi";
import type { OrderModel } from "./model";

const ORDER_INCLUDE = {
  items: true,
  user: {
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true },
  },
  address: true,
  coupon: {
    select: { id: true, code: true, discountType: true, discountValue: true },
  },
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
    if (query.statuses) {
      const statusList = query.statuses.split(",").filter(Boolean);
      if (statusList.length > 0) where.status = { in: statusList };
    }

    if (query.search) {
      const q = query.search;
      const searchTerms = q.split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        const conditions = searchTerms.flatMap((term) => [
          { id: { contains: term, mode: "insensitive" } },
          { shippingFirstName: { contains: term, mode: "insensitive" } },
          { shippingLastName: { contains: term, mode: "insensitive" } },
          { guestEmail: { contains: term, mode: "insensitive" } },
          { guestFirstName: { contains: term, mode: "insensitive" } },
          { guestLastName: { contains: term, mode: "insensitive" } },
          { shippingPhone: { contains: term, mode: "insensitive" } },
          { shippingCity: { contains: term, mode: "insensitive" } },
          { user: { email: { contains: term, mode: "insensitive" } } },
          { user: { firstName: { contains: term, mode: "insensitive" } } },
          { user: { lastName: { contains: term, mode: "insensitive" } } },
        ]);
        where.OR = conditions;
      }
    }

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
        imageUrl,
      };
    });

    // Shipping is computed authoritatively from the order subtotal (free at or
    // above FREE_SHIPPING_THRESHOLD). The client-supplied value is ignored.
    const shippingCost = getShippingCost(total);
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
        paymentMethod: "COD",
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
        fbp: body.fbp || null,
        fbc: body.fbc || null,
        items: { create: orderItems },
      },
      include: ORDER_INCLUDE,
    });

    const customerEmail = order.user?.email || order.guestEmail || "";
    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : `${order.guestFirstName || ""} ${order.guestLastName || ""}`.trim();
    const customerPhone = order.user?.phone || order.guestPhone;

    if (customerEmail) {
      const emailData = {
        orderId: order.id,
        customerName,
        customerEmail,
        customerPhone: customerPhone || undefined,
        items: order.items.map((item) => ({
          productNameEn: item.productNameEn,
          productNameAr: item.productNameAr,
          variantNameEn: item.variantNameEn || undefined,
          variantNameAr: item.variantNameAr || undefined,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
        })),
        subtotal: order.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        shippingCost,
        discountAmount,
        total: grandTotal,
        couponCode: body.couponCode,
        paymentMethod: "COD",
        shippingAddress: {
          firstName: body.shippingFirstName,
          lastName: body.shippingLastName,
          street: body.shippingStreet,
          city: body.shippingCity,
          state: body.shippingState,
          zipCode: body.shippingZipCode,
          country: body.shippingCountry,
          phone: body.shippingPhone || undefined,
        },
        note: body.note || undefined,
      };

      await Promise.all([
        EmailService.sendOrderNotification(emailData),
        EmailService.sendCustomerConfirmation(emailData),
      ]);
    }

    await sendMetaEvent({
      eventName: "Purchase",
      email: customerEmail,
      phone: customerPhone || undefined,
      firstName: order.user?.firstName || order.guestFirstName || undefined,
      lastName: order.user?.lastName || order.guestLastName || undefined,
      city: body.shippingCity,
      state: body.shippingState,
      zipCode: body.shippingZipCode,
      country: body.shippingCountry,
      externalId: order.userId || undefined,
      value: grandTotal,
      currency: "AED",
      orderId: order.id,
      eventId: `order_${order.id}`,
      fbp: body.fbp,
      fbc: body.fbc,
      eventSourceUrl: `${process.env.MARKETING_URL || ""}/checkout`,
    });

    return order;
  }

  static async updateStatus(id: string, statusValue: string) {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!existing) return null;

    const updated = await prisma.order.update({
      where: { id },
      data: { status: statusValue as never },
      include: ORDER_INCLUDE,
    });

    if (existing.status !== statusValue) {
      const customerEmail = updated.user?.email || updated.guestEmail || "";
      const customerName = updated.user
        ? `${updated.user.firstName} ${updated.user.lastName}`
        : `${updated.guestFirstName || ""} ${updated.guestLastName || ""}`.trim();

      if (customerEmail) {
        await EmailService.sendStatusUpdate({
          orderId: updated.id,
          customerName,
          customerEmail,
          newStatus: statusValue,
        });
      }
    }

    return updated;
  }

  static async delete(id: string) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.order.delete({ where: { id } });
    return true;
  }

  static async bulkDelete(ids: string[]) {
    const result = await prisma.order.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  static async updatePaymentStatus(id: string, paid: boolean) {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!existing) return null;

    const updated = await prisma.order.update({
      where: { id },
      data: { paidAt: paid ? new Date() : null },
      include: ORDER_INCLUDE,
    });

    return updated;
  }
}
