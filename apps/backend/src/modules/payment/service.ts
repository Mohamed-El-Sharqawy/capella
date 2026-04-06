import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import type { PaymentModel } from "./model";

// Lazy Stripe client - only initialize when needed
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === "sk_test_placeholder") {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in .env");
    }
    stripe = new Stripe(key, {
      apiVersion: "2024-11-20.acacia",
    });
  }
  return stripe;
}

const MARKETING_URL = process.env.MARKETING_URL || "http://localhost:3000";

export abstract class PaymentService {
  /**
   * Create a Stripe checkout session
   * 1. Validate stock for all items
   * 2. Create order with PENDING status
   * 3. Create Stripe checkout session
   * 4. Return session ID and URL
   */
  static async createCheckoutSession(
    body: PaymentModel["checkoutBody"],
    userId?: string
  ) {
    const { items, customerEmail, successUrl, cancelUrl, couponCode, ...shippingData } = body;

    // 1. Validate stock and get variant details
    const variantIds = items.map((item) => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { nameEn: true, nameAr: true } },
      },
    });

    if (variants.length !== items.length) {
      throw new Error("Some variants not found");
    }

    // Check stock
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }
      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${variant.product.nameEn}`);
      }
    }

    // Calculate total
    let total = 0;
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: {
          name: string;
          metadata: Record<string, string>;
        };
        unit_amount: number;
      };
      quantity: number;
    }> = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const itemTotal = variant.price * item.quantity;
      total += itemTotal;

      return {
        price_data: {
          currency: "aed",
          product_data: {
            name: `${variant.product.nameEn} - ${variant.nameEn}`,
            metadata: {
              variantId: variant.id,
              productId: variant.productId,
            },
          },
          unit_amount: Math.round(variant.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId: string | undefined;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode, isActive: true },
      });
      if (coupon) {
        const now = new Date();
        if (!coupon.expiresAt || coupon.expiresAt > now) {
          if (coupon.minOrderAmount && total < coupon.minOrderAmount) {
            throw new Error(`Minimum purchase amount is ${coupon.minOrderAmount} AED`);
          }
          
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (total * coupon.discountValue) / 100;
          } else {
            discountAmount = coupon.discountValue;
          }
          
          // Create Stripe coupon for the discount
          const stripeCoupon = await getStripe().coupons.create({
            amount_off: Math.round(discountAmount * 100),
            currency: "aed",
            duration: "once",
            name: coupon.code,
          });
          couponId = stripeCoupon.id;
        }
      }
    }

    // 2. Create order with PENDING status
    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        guestEmail: shippingData.guestEmail,
        guestFirstName: shippingData.guestFirstName,
        guestLastName: shippingData.guestLastName,
        guestPhone: shippingData.guestPhone,
        status: "PENDING",
        total,
        discountAmount,
        couponId: couponId ? (await prisma.coupon.findFirst({ where: { code: couponCode } }))?.id : null,
        paymentMethod: "STRIPE",
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
            };
          }),
        },
      },
    });

    // 3. Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl || `${MARKETING_URL}/en/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${MARKETING_URL}/en/checkout/cancel`,
      customer_email: customerEmail || shippingData.guestEmail,
      discounts: couponId ? [{ coupon: couponId }] : undefined,
      metadata: {
        orderId: order.id,
        userId: userId || "",
      },
    });

    // 4. Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return {
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
    };
  }

  /**
   * Handle Stripe webhook events
   * 1. Verify signature
   * 2. Handle checkout.session.completed
   * 3. Handle checkout.session.expired
   */
  static async handleWebhook(payload: string, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutExpired(session);
        break;
      }
      default:
        // Ignore other events
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle successful checkout
   * 1. Find order by stripeSessionId
   * 2. Check idempotency (skip if already PAID/CANCELLED)
   * 3. Re-validate stock
   * 4. Update order status to PAID
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.error("No orderId in session metadata");
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Idempotency check
    if (order.status === "DELIVERED" || order.status === "SHIPPED") {
      console.log(`Order ${orderId} already processed`);
      return;
    }

    // Re-validate stock
    for (const item of order.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant || variant.stock < item.quantity) {
        // Out of stock - refund and mark as REFUNDED
        console.error(`Insufficient stock for variant ${item.variantId}, refunding`);
        
        if (session.payment_intent) {
          await getStripe().refunds.create({
            payment_intent: session.payment_intent as string,
            reason: "requested_by_customer",
          });
        }

        await prisma.order.update({
          where: { id: orderId },
          data: { status: "REFUNDED" },
        });
        return;
      }
    }

    // Deduct stock
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    // Update order to CONFIRMED (paid)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        paidAt: new Date(),
      },
    });

    console.log(`Order ${orderId} marked as CONFIRMED (paid)`);
  }

  /**
   * Handle expired checkout session
   * Update order status to CANCELLED
   */
  private static async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.error("No orderId in session metadata");
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Only cancel if still PENDING
    if (order.status === "PENDING") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      console.log(`Order ${orderId} marked as CANCELLED (session expired)`);
    }
  }
}
