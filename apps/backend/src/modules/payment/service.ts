import { prisma } from "../../lib/prisma";
import { ZiinaClient, type PaymentIntentResponse } from "./ziina-client";
import type { PaymentModel } from "./model";

const MARKETING_URL = process.env.MARKETING_URL || "http://localhost:3000";
const SHIPPING_COST_AED = 25;

export abstract class PaymentService {
  static async createCheckoutSession(
    body: PaymentModel["checkoutBody"],
    userId?: string
  ) {
    const {
      items,
      customerEmail,
      successUrl,
      cancelUrl,
      couponCode,
      locale,
      ...shippingData
    } = body;
    const lang = locale || "en";

    const variantIds = items.map((item) => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { nameEn: true, nameAr: true } },
        images: {
          orderBy: { position: "asc" },
          take: 1,
          include: { image: true },
        },
      },
    });

    if (variants.length !== items.length) {
      throw new Error("Some variants not found");
    }

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }
      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${variant.product.nameEn}`);
      }
    }

    let subtotal = 0;
    items.forEach((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      subtotal += variant.price * item.quantity;
    });

    let discountAmount = 0;
    let couponDbId: string | undefined;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode, isActive: true },
      });
      if (coupon) {
        const now = new Date();
        if (!coupon.expiresAt || coupon.expiresAt > now) {
          if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
            throw new Error(
              `Minimum purchase amount is ${coupon.minOrderAmount} AED`
            );
          }
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (subtotal * coupon.discountValue) / 100;
          } else {
            discountAmount = coupon.discountValue;
          }
          couponDbId = coupon.id;
        }
      }
    }

    const totalAmount = subtotal - discountAmount + SHIPPING_COST_AED;
    if (totalAmount <= 0) {
      throw new Error("Invalid order total");
    }

    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        guestEmail: shippingData.guestEmail,
        guestFirstName: shippingData.guestFirstName,
        guestLastName: shippingData.guestLastName,
        guestPhone: shippingData.guestPhone,
        status: "PENDING",
        total: totalAmount,
        discountAmount,
        couponId: couponDbId || null,
        paymentMethod: "ZIINA",
        shippingFirstName: shippingData.shippingFirstName,
        shippingLastName: shippingData.shippingLastName,
        shippingStreet: shippingData.shippingStreet,
        shippingCity: shippingData.shippingCity,
        shippingState: shippingData.shippingState,
        shippingZipCode: shippingData.shippingZipCode,
        shippingCountry: shippingData.shippingCountry,
        shippingPhone: shippingData.shippingPhone,
        addressId: shippingData.addressId,
        note: shippingData.note,
        items: {
          create: items.map((item) => {
            const variant = variants.find((v) => v.id === item.variantId)!;
            return {
              variantId: item.variantId,
              productNameEn: variant.product.nameEn,
              productNameAr: variant.product.nameAr,
              variantNameEn: variant.nameEn,
              variantNameAr: variant.nameAr,
              sku: variant.sku,
              quantity: item.quantity,
              price: variant.price,
              imageUrl: variant.images[0]?.image?.url || null,
            };
          }),
        },
      },
    });

    const paymentIntent = await ZiinaClient.createPaymentIntent({
      amount: Math.round(totalAmount * 100),
      currency_code: "AED",
      success_url:
        successUrl ||
        `${MARKETING_URL}/${lang}/checkout/success?payment_intent_id={PAYMENT_INTENT_ID}`,
      cancel_url:
        cancelUrl ||
        `${MARKETING_URL}/${lang}/checkout?method=ZIINA${couponCode ? `&coupon=${couponCode.toUpperCase()}` : ""}`,
      failure_url:
        cancelUrl ||
        `${MARKETING_URL}/${lang}/checkout?method=ZIINA${couponCode ? `&coupon=${couponCode.toUpperCase()}` : ""}`,
      message: `Order ${order.id}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { ziinaPaymentIntentId: paymentIntent.id },
    });

    return {
      paymentIntentId: paymentIntent.id,
      url: paymentIntent.redirect_url,
      orderId: order.id,
    };
  }

  static async handleWebhook(
    payload: string,
    signature: string,
    clientIp?: string
  ) {
    const webhookSecret = process.env.ZIINA_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("ZIINA_WEBHOOK_SECRET is not configured");
    }

    if (!ZiinaClient.verifyWebhookSignature(payload, signature, webhookSecret)) {
      throw new Error("Webhook signature verification failed");
    }

    if (clientIp && !ZiinaClient.isAllowedIp(clientIp)) {
      console.warn(`⚠️ Webhook from untrusted IP: ${clientIp}`);
    }

    const event = ZiinaClient.parseWebhookPayload(payload);
    console.log(`📩 Received Ziina Event: ${event.event}`);

    if (event.event === "payment_intent.status.updated") {
      const intent = event.data;

      switch (intent.status) {
        case "completed":
          await this.handlePaymentCompleted(intent);
          break;
        case "canceled":
          await this.handlePaymentCancelled(intent);
          break;
        case "failed":
          await this.handlePaymentFailed(intent);
          break;
        default:
          console.log(`Unhandled intent status: ${intent.status}`);
      }
    }

    return { received: true };
  }

  private static async handlePaymentCompleted(
    intent: PaymentIntentResponse
  ) {
    const order = await prisma.order.findUnique({
      where: { ziinaPaymentIntentId: intent.id },
      include: { items: true },
    });

    if (!order) {
      console.error(`Order not found for payment intent ${intent.id}`);
      return;
    }

    if (order.status === "DELIVERED" || order.status === "SHIPPED") {
      console.log(`Order ${order.id} already processed`);
      return;
    }

    for (const item of order.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant || variant.stock < item.quantity) {
        console.error(
          `Insufficient stock for variant ${item.variantId}, refunding`
        );
        try {
          await ZiinaClient.createRefund({
            payment_intent_id: intent.id,
            amount: intent.amount,
            currency_code: intent.currency_code,
          });
        } catch (refundErr) {
          console.error("Refund failed:", refundErr);
        }
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "REFUNDED" },
        });
        return;
      }
    }

    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED", paidAt: new Date() },
    });

    if (order.couponId) {
      const { CouponService } = await import("../coupon/service");
      await CouponService.incrementUsage(order.couponId);
    }

    console.log(`Order ${order.id} marked as CONFIRMED (paid via Ziina)`);
  }

  private static async handlePaymentCancelled(
    intent: PaymentIntentResponse
  ) {
    const order = await prisma.order.findUnique({
      where: { ziinaPaymentIntentId: intent.id },
    });

    if (!order) {
      console.error(`Order not found for payment intent ${intent.id}`);
      return;
    }

    if (order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      console.log(
        `Order ${order.id} marked as CANCELLED (payment cancelled)`
      );
    }
  }

  private static async handlePaymentFailed(
    intent: PaymentIntentResponse
  ) {
    const order = await prisma.order.findUnique({
      where: { ziinaPaymentIntentId: intent.id },
    });

    if (!order) {
      console.error(`Order not found for payment intent ${intent.id}`);
      return;
    }

    if (order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      console.log(
        `Order ${order.id} marked as CANCELLED (payment failed)`
      );
    }
  }

  static async registerWebhook(): Promise<void> {
    const webhookSecret = process.env.ZIINA_WEBHOOK_SECRET;
    const webhookUrl = process.env.ZIINA_WEBHOOK_URL;

    if (!webhookSecret) {
      console.warn(
        "⚠️ ZIINA_WEBHOOK_SECRET not set, skipping webhook registration"
      );
      return;
    }

    if (!webhookUrl) {
      console.warn(
        "⚠️ ZIINA_WEBHOOK_URL not set, skipping webhook registration. Set it to your public backend URL (e.g. https://api.yourdomain.com/api/payments/webhook)"
      );
      return;
    }

    try {
      const result = await ZiinaClient.registerWebhook(
        webhookUrl,
        webhookSecret
      );
      if (result.success) {
        console.log(`✅ Ziina webhook registered: ${webhookUrl}`);
      } else {
        console.error(
          `❌ Failed to register Ziina webhook: ${result.error}`
        );
      }
    } catch (err) {
      console.error("❌ Ziina webhook registration error:", err);
    }
  }
}
