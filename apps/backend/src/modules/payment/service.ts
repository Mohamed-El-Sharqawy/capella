import { prisma } from "../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import { ZiinaClient } from "./ziina-client";
import { TabbyClient } from "./tabby-client";
import { TamaraClient, money as tamaraMoney } from "./tamara-client";
import { EmailService } from "../email/service";
import {
  sendMetaEvent,
  buildCapiItems,
  capiContextFromOrder,
  capiMetadataFields,
  type CapiContext,
} from "../../lib/meta-capi";
import { getShippingCost, CURRENCY } from "@ecommerce/shared-utils";
import type { PaymentModel } from "./model";
import {
  assertInStock,
  decrementStock,
  OutOfStockError,
  releaseOrderStock,
} from "../../lib/stock";

const MARKETING_URL = process.env.MARKETING_URL || "http://localhost:3000";

export type PaymentMethodName = "ZIINA" | "TABBY" | "TAMARA";

interface ProviderDescriptor {
  paymentMethod: PaymentMethodName;
  /** Refund the full order amount (in AED). */
  refund?: (amountAed: number) => Promise<unknown>;
}

type VariantWithProduct = Prisma.ProductVariantGetPayload<{
  include: {
    product: { select: { nameEn: true; nameAr: true; isActive: true } };
    images: {
      orderBy: { position: "asc" };
      take: number;
      include: { image: true };
    };
  };
}>;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; user: true; address: true; coupon: true };
}>;

interface PreparedOrder {
  order: Awaited<ReturnType<typeof prisma.order.create>>;
  variants: VariantWithProduct[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
}

class AlreadyProcessedError extends Error {}

/** Filled by prepareOrder so a failed provider call can release the hold. */
interface CheckoutAttempt {
  orderId?: string;
}

export abstract class PaymentService {
  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  /** Validate variants/stock/coupon, compute totals and create a PENDING order. */
  private static async prepareOrder(
    body: PaymentModel["checkoutBody"],
    userId: string | undefined,
    paymentMethod: PaymentMethodName,
    capiCtx?: CapiContext,
    attempt?: CheckoutAttempt,
  ): Promise<PreparedOrder> {
    const { items, couponCode, ...shippingData } = body;

    const variantIds = items.map((item) => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { nameEn: true, nameAr: true, isActive: true } },
        images: {
          orderBy: { position: "asc" },
          take: 1,
          include: { image: true },
        },
      },
    });

    // Missing, inactive or out-of-stock variants are all reported as
    // OUT_OF_STOCK so the storefront can refresh the cart and tell the
    // customer exactly which items to remove/adjust.
    assertInStock(items, variants);

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

    const shippingCost = getShippingCost(subtotal);
    const totalAmount = subtotal - discountAmount + shippingCost;
    if (totalAmount <= 0) {
      throw new Error("Invalid order total");
    }

    // Create the PENDING order and hold its units in one transaction, so the
    // stock can't be sold to someone else while this customer is paying. The
    // hold is released if the payment is cancelled/fails/expires (see
    // cancelPendingOrder and releaseExpiredReservations).
    const order = await prisma.$transaction(async (tx) => {
      await decrementStock(tx, items);
      return tx.order.create({
        data: {
          stockReserved: true,
          userId: userId || null,
          guestEmail: shippingData.guestEmail,
          guestFirstName: shippingData.guestFirstName,
          guestLastName: shippingData.guestLastName,
          guestPhone: shippingData.guestPhone,
          status: "PENDING",
          total: totalAmount,
          shippingAmount: shippingCost,
          discountAmount,
          couponId: couponDbId || null,
          paymentMethod,
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
          fbp: (shippingData as any).fbp || null,
          fbc: (shippingData as any).fbc || null,
          ...(Object.keys(capiMetadataFields(capiCtx)).length > 0
            ? { capiContext: capiMetadataFields(capiCtx) }
            : {}),
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
    });

    if (attempt) attempt.orderId = order.id;

    return { order, variants, subtotal, discountAmount, shippingCost };
  }

  /**
   * The customer came back from the payment page without paying (cancel /
   * back button). Release the hold now instead of waiting for expiry, so
   * the units show as available again (including in their own cart).
   * Only unpaid online PENDING orders are affected; a payment that still
   * completes afterwards is handled by markOrderPaid (re-reserve or refund).
   */
  static async releaseAbandonedCheckout(orderId: string): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentMethod: true, paidAt: true },
    });
    if (!order || order.status !== "PENDING" || order.paidAt || order.paymentMethod === "COD") {
      return false;
    }
    const released = await releaseOrderStock(order.id, {
      onlyIfStatus: "PENDING",
      nextStatus: "CANCELLED",
    });
    if (released) console.log(`Order ${order.id} cancelled: customer returned without paying`);
    return released;
  }

  /**
   * Cancel unpaid online orders whose stock hold is older than
   * STOCK_RESERVATION_MINUTES (default 30) and return their units. Covers
   * customers who close the tab on the payment page (no webhook ever comes).
   */
  static async releaseExpiredReservations(): Promise<number> {
    const minutes = Number(process.env.STOCK_RESERVATION_MINUTES) || 30;
    const cutoff = new Date(Date.now() - minutes * 60_000);
    const expired = await prisma.order.findMany({
      where: {
        status: "PENDING",
        stockReserved: true,
        paidAt: null,
        paymentMethod: { not: "COD" },
        createdAt: { lt: cutoff },
      },
      select: { id: true },
      take: 200,
    });
    let count = 0;
    for (const { id } of expired) {
      if (await releaseOrderStock(id, { onlyIfStatus: "PENDING", nextStatus: "CANCELLED" })) count++;
    }
    if (count > 0) console.log(`Released stock for ${count} expired unpaid order(s)`);
    return count;
  }

  /** Tell the customer their paid order was refunded because stock ran out. */
  private static async notifyOutOfStockRefund(
    order: OrderWithRelations,
    paymentMethod: PaymentMethodName,
  ) {
    const customerEmail = order.user?.email || order.guestEmail || "";
    if (!customerEmail) return;
    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : `${order.guestFirstName || ""} ${order.guestLastName || ""}`.trim();
    try {
      await EmailService.sendStatusUpdate({
        orderId: order.id,
        customerName,
        customerEmail,
        newStatus: "REFUNDED",
      });
    } catch (emailErr) {
      console.error(`Failed to send out-of-stock refund email (${paymentMethod}):`, emailErr);
    }
  }

  /**
   * Finalize a paid order: idempotent guard, stock re-check (refund on
   * shortage), stock decrement, status -> CONFIRMED, coupon increment,
   * notification emails and Meta Purchase event.
   */
  private static async markOrderPaid(
    order: OrderWithRelations | null,
    provider: ProviderDescriptor
  ) {
    if (!order) return;

    // Already finalized (paid, or refunded): duplicate webhook.
    const FINAL_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "REFUNDED"];
    if (FINAL_STATUSES.includes(order.status)) {
      console.log(`Order ${order.id} already processed (${order.status}), skipping duplicate webhook`);
      return;
    }

    // Three cases, each claimed with a conditional update so concurrent
    // webhooks can't double-process:
    //  - PENDING with a stock hold (normal): units were reserved at checkout,
    //    just confirm.
    //  - PENDING without a hold (legacy order) or CANCELLED (the hold expired
    //    or the customer abandoned, then paid anyway): take the units now; if
    //    they've been sold meanwhile, refund instead.
    const lines = order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
    try {
      await prisma.$transaction(async (tx) => {
        const confirmedHeld = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING", stockReserved: true },
          data: { status: "CONFIRMED", paidAt: new Date() },
        });
        if (confirmedHeld.count === 1) return;

        const claimed = await tx.order.updateMany({
          where: {
            id: order.id,
            status: { in: ["PENDING", "CANCELLED"] },
            stockReserved: false,
          },
          data: { status: "CONFIRMED", paidAt: new Date(), stockReserved: true },
        });
        if (claimed.count === 0) throw new AlreadyProcessedError();
        await decrementStock(tx, lines);
      });
    } catch (err) {
      if (err instanceof AlreadyProcessedError) {
        console.log(`Order ${order.id} finalized by a concurrent webhook, skipping`);
        return;
      }
      if (!(err instanceof OutOfStockError)) throw err;

      console.error(
        `Insufficient stock for order ${order.id} after payment, refunding:`,
        err.items,
      );
      try {
        if (provider.refund) await provider.refund(order.total);
      } catch (refundErr) {
        console.error("Refund failed:", refundErr);
      }
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED", stockReserved: false },
      });
      await this.notifyOutOfStockRefund(order, provider.paymentMethod);
      return;
    }

    if (order.couponId) {
      const { CouponService } = await import("../coupon/service");
      await CouponService.incrementUsage(order.couponId);
    }

    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : `${order.guestFirstName || ""} ${order.guestLastName || ""}`.trim();
    const customerEmail = order.user?.email || order.guestEmail || "";
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
        shippingCost: order.shippingAmount,
        discountAmount: order.discountAmount,
        total: order.total,
        couponCode: order.coupon?.code,
        paymentMethod: provider.paymentMethod,
        shippingAddress: {
          firstName: order.shippingFirstName,
          lastName: order.shippingLastName,
          street: order.shippingStreet,
          city: order.shippingCity,
          state: order.shippingState,
          zipCode: order.shippingZipCode,
          country: order.shippingCountry,
          phone: order.shippingPhone || undefined,
        },
        note: order.note || undefined,
      };

      await Promise.all([
        EmailService.sendOrderNotification(emailData),
        EmailService.sendCustomerConfirmation(emailData),
      ]);
    }

    const persistedCtx = capiContextFromOrder(order);
    const ctx: CapiContext = persistedCtx ?? {
      fbp: order.fbp || undefined,
      fbc: order.fbc || undefined,
    };

    const itemsPayload = buildCapiItems(
      order.items.map((i) => ({
        variantId: i.variantId,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
      })),
    );

    await sendMetaEvent({
      eventName: "Purchase",
      email: customerEmail,
      phone: customerPhone || undefined,
      firstName: order.user?.firstName || order.guestFirstName || undefined,
      lastName: order.user?.lastName || order.guestLastName || undefined,
      city: order.shippingCity,
      state: order.shippingState,
      zipCode: order.shippingZipCode,
      country: order.shippingCountry,
      externalId: order.userId || undefined,
      value: order.total,
      currency: CURRENCY,
      orderId: order.id,
      eventId: `order_${order.id}`,
      source: "webhook",
      userAgent: ctx.clientUserAgent,
      ip: ctx.clientIpAddress,
      fbp: ctx.fbp,
      fbc: ctx.fbc,
      eventSourceUrl: ctx.eventSourceUrl,
      contentIds: itemsPayload.contentIds,
      contents: itemsPayload.contents,
      numItems: itemsPayload.numItems,
      contentType: "product",
    });

    console.log(`Order ${order.id} marked as CONFIRMED (paid via ${provider.paymentMethod})`);
  }

  /** Move a still-PENDING order to CANCELLED (idempotent for non-pending). */
  private static async cancelPendingOrder(
    order: Awaited<ReturnType<typeof prisma.order.findUnique>> | null,
    reason: string
  ) {
    if (!order) return;
    if (order.status === "PENDING") {
      // Atomically cancel + return held units (no-op if a concurrent webhook
      // already moved the order on).
      const released = await releaseOrderStock(order.id, {
        onlyIfStatus: "PENDING",
        nextStatus: "CANCELLED",
      });
      if (!released) {
        // Legacy order without a stock hold: just cancel it.
        await prisma.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }
      console.log(`Order ${order.id} marked as CANCELLED (${reason})`);
    }
  }

  /** Build order-contact info used by Tabby/Tamara from the checkout body. */
  private static getCustomerContact(body: PaymentModel["checkoutBody"]) {
    const firstName =
      body.shippingFirstName || body.guestFirstName || "";
    const lastName =
      body.shippingLastName || body.guestLastName || "";
    const email = body.customerEmail || body.guestEmail || "";
    const phone = body.shippingPhone || body.guestPhone || "";
    return { name: `${firstName} ${lastName}`.trim(), email, phone };
  }

  // ---------------------------------------------------------------------------
  // Checkout dispatcher
  // ---------------------------------------------------------------------------

  /**
   * Which payment methods are enabled. Tabby/Tamara can be toggled off via the
   * TABBY_ENABLED / TAMARA_ENABLED env vars — disabled only when === "false"
   * (default on, so existing deployments keep working until you opt out).
   */
  static getEnabledMethods() {
    return {
      cod: true,
      ziina: true,
      tabby: process.env.TABBY_ENABLED !== "false",
      tamara: process.env.TAMARA_ENABLED !== "false",
    };
  }

  /**
   * Resolve the storefront base URL to send the customer back to after payment.
   * Prefers the request's Origin header — the exact subdomain the customer is
   * on (e.g. preview.capellauae.com vs capellauae.com) — so return/cancel/success
   * redirects always land on the same environment the order started from.
   * Falls back to MARKETING_URL, then localhost (dev).
   */
  private static resolveMarketingUrl(origin?: string): string {
    if (origin && /^https?:\/\//i.test(origin)) {
      return origin.replace(/\/+$/, "");
    }
    return MARKETING_URL.replace(/\/+$/, "");
  }

  static async createCheckoutSession(
    body: PaymentModel["checkoutBody"],
    userId?: string,
    origin?: string,
    capiCtx?: CapiContext,
  ) {
    const method = (body.method as PaymentMethodName | undefined) || "ZIINA";
    const attempt: CheckoutAttempt = {};
    try {
      switch (method) {
        case "ZIINA":
          return await this.createZiinaCheckout(body, userId, origin, capiCtx, attempt);
        case "TABBY":
          return await this.createTabbyCheckout(body, userId, origin, capiCtx, attempt);
        case "TAMARA":
          return await this.createTamaraCheckout(body, userId, origin, capiCtx, attempt);
        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }
    } catch (err) {
      // The order (and its stock hold) was created but the provider session
      // failed (e.g. Tabby rejected the customer): give the units back.
      if (attempt.orderId) {
        await releaseOrderStock(attempt.orderId, {
          onlyIfStatus: "PENDING",
          nextStatus: "CANCELLED",
        }).catch((releaseErr) =>
          console.error(`Failed to release stock for order ${attempt.orderId}:`, releaseErr),
        );
      }
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Ziina
  // ---------------------------------------------------------------------------

  private static async createZiinaCheckout(
    body: PaymentModel["checkoutBody"],
    userId?: string,
    origin?: string,
    capiCtx?: CapiContext,
    attempt?: CheckoutAttempt,
  ) {
    const { successUrl, cancelUrl, couponCode, locale } = body;
    const lang = locale || "en";
    const marketingUrl = this.resolveMarketingUrl(origin);

    const { order } = await this.prepareOrder(body, userId, "ZIINA", capiCtx, attempt);

    const paymentIntent = await ZiinaClient.createPaymentIntent({
      amount: Math.round(order.total * 100),
      currency_code: CURRENCY,
      success_url:
        successUrl ||
        `${marketingUrl}/${lang}/checkout/success?payment_intent_id={PAYMENT_INTENT_ID}`,
      cancel_url:
        cancelUrl ||
        `${marketingUrl}/${lang}/checkout?method=ZIINA${couponCode ? `&coupon=${couponCode.toUpperCase()}` : ""}`,
      failure_url:
        cancelUrl ||
        `${marketingUrl}/${lang}/checkout?method=ZIINA${couponCode ? `&coupon=${couponCode.toUpperCase()}` : ""}`,
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
        case "completed": {
          const order = await prisma.order.findUnique({
            where: { ziinaPaymentIntentId: intent.id },
            include: { items: true, user: true, address: true, coupon: true },
          });
          await this.markOrderPaid(order, {
            paymentMethod: "ZIINA",
            refund: (amount) =>
              ZiinaClient.createRefund({
                payment_intent_id: intent.id,
                amount: Math.round(amount * 100),
                currency_code: intent.currency_code,
              }),
          });
          break;
        }
        case "canceled": {
          const order = await prisma.order.findUnique({
            where: { ziinaPaymentIntentId: intent.id },
          });
          await this.cancelPendingOrder(order, "payment cancelled");
          break;
        }
        case "failed": {
          const order = await prisma.order.findUnique({
            where: { ziinaPaymentIntentId: intent.id },
          });
          await this.cancelPendingOrder(order, "payment failed");
          break;
        }
        default:
          console.log(`Unhandled intent status: ${intent.status}`);
      }
    }

    return { received: true };
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

  // ---------------------------------------------------------------------------
  // Tabby (https://docs.tabby.ai)
  // ---------------------------------------------------------------------------

  /**
   * Look up the local order status by Tabby payment id. Used by the success
   * page to confirm the order was actually paid (CONFIRMED via the webhook)
   * before clearing the cart — so cart-clearing is tied to a verified payment,
   * not merely to landing on the return route.
   */
  static async getTabbyOrderStatus(
    paymentId: string
  ): Promise<string | null> {
    const order = await prisma.order.findUnique({
      where: { tabbyPaymentId: paymentId },
      select: { status: true },
    });
    return order?.status ?? null;
  }

  static async getOrderStatus(orderId: string): Promise<string | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return order?.status ?? null;
  }

  /**
   * Background pre-scoring (eligibility) check — run before offering Tabby as a
   * payment option. Calls POST /api/v2/checkout with a minimal payload.
   *
   * Fail-safe: any error, timeout, or missing data defaults to `available`
   * (the authoritative check reruns at session creation, where a rejection
   * surfaces a clear message instead of a silent dead-end).
   * https://docs.tabby.ai/pay-in-4-custom-integration/checkout-flow#background-pre-scoring-check
   */
  static async checkTabbyEligibility(params: {
    amount: number;
    email?: string;
    phone?: string;
  }): Promise<{ available: boolean; rejectionReason?: string }> {
    const merchantCode = process.env.TABBY_MERCHANT_CODE;
    if (
      !merchantCode ||
      merchantCode === "your_tabby_merchant_code" ||
      process.env.TABBY_ENABLED === "false"
    ) {
      return { available: true };
    }
    if (!params.email || !params.phone || params.amount <= 0) {
      return { available: true };
    }
    try {
      const res = await TabbyClient.checkEligibility({
        amount: params.amount.toFixed(2),
        currency: CURRENCY,
        buyer: { email: params.email, phone: params.phone },
        merchantCode,
      });
      if (res.status === "rejected") {
        return {
          available: false,
          rejectionReason:
            res.configuration?.products?.installments?.rejection_reason,
        };
      }
      return { available: true };
    } catch (err) {
      console.warn(
        "Tabby pre-scoring check failed, defaulting to available:",
        err
      );
      return { available: true };
    }
  }

  private static async createTabbyCheckout(
    body: PaymentModel["checkoutBody"],
    userId?: string,
    origin?: string,
    capiCtx?: CapiContext,
    attempt?: CheckoutAttempt,
  ) {
    if (process.env.TABBY_ENABLED === "false") {
      throw new Error("Tabby is currently unavailable. Please choose another payment method.");
    }
    const merchantCode = process.env.TABBY_MERCHANT_CODE;
    if (!merchantCode) {
      throw new Error("Tabby is not configured. Set TABBY_MERCHANT_CODE in .env");
    }
    const { locale } = body;
    const lang = (locale || "en") === "ar" ? "ar" : "en";
    const marketingUrl = this.resolveMarketingUrl(origin);

    const { order, variants, shippingCost } = await this.prepareOrder(body, userId, "TABBY", capiCtx, attempt);
    const contact = this.getCustomerContact(body);

    const session = await TabbyClient.createCheckoutSession({
      amount: order.total.toFixed(2),
      currency: CURRENCY,
      description: `Capella order ${order.id}`,
      merchantCode,
      lang,
      buyer: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      },
      shipping_address: {
        city: order.shippingCity,
        address: order.shippingStreet,
        zip: order.shippingZipCode || "00000",
      },
      order_reference_id: order.id,
      items: body.items.map((item) => {
        const variant = variants.find((v) => v.id === item.variantId)!;
        return {
          reference_id: variant.sku || variant.id,
          title: variant.product.nameEn,
          quantity: item.quantity,
          unit_price: variant.price.toFixed(2),
          category: "Jewellery",
          image_url: variant.images[0]?.image?.url || undefined,
          brand: "Capella",
        };
      }),
      shipping_amount: shippingCost.toFixed(2),
      discount_amount: order.discountAmount.toFixed(2),
      merchant_urls: {
        success: `${marketingUrl}/${lang}/checkout/success?method=TABBY`,
        // Distinct outcome pages — neither clears the cart, and each shows a
        // specific message (approved wording from the Tabby redirect docs).
        cancel: `${marketingUrl}/${lang}/checkout/cancel?reason=cancel`,
        failure: `${marketingUrl}/${lang}/checkout/cancel?reason=rejected`,
      },
    });

    const webUrl =
      session.configuration?.available_products?.installments?.[0]?.web_url;

    if (session.status === "rejected" || !webUrl) {
      throw new Error(
        "Tabby is not available for this order. Please choose another payment method."
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { tabbyPaymentId: session.payment.id },
    });

    return {
      paymentIntentId: session.payment.id,
      url: webUrl,
      orderId: order.id,
    };
  }

  static async handleTabbyWebhook(
    payload: string,
    signature: string | undefined,
    clientIp?: string
  ) {
    if (clientIp && !TabbyClient.isAllowedIp(clientIp)) {
      console.warn(`⚠️ Tabby webhook from untrusted IP: ${clientIp}`);
    }

    const webhookSecret = process.env.TABBY_WEBHOOK_SECRET;
    // The signing secret is optional in Tabby — when absent we still verify
    // authoritatively by re-fetching the payment from the Tabby API below.
    if (
      webhookSecret &&
      !TabbyClient.verifyWebhookSignature(payload, signature, webhookSecret)
    ) {
      throw new Error("Tabby webhook signature verification failed");
    }

    const event = TabbyClient.parseWebhookPayload(payload);
    const paymentId = event.id;
    if (!paymentId) {
      console.warn("Tabby webhook received without a payment id");
      return { received: true };
    }

    console.log(`📩 Received Tabby Event: status=${event.status} id=${paymentId}`);

    // Always verify the status server-to-server (never trust the webhook alone).
    const payment = await TabbyClient.retrievePayment(paymentId);

    const order = await prisma.order.findUnique({
      where: { tabbyPaymentId: paymentId },
      include: { items: true, user: true, address: true, coupon: true },
    });
    if (!order) {
      console.error(`Order not found for Tabby payment ${paymentId}`);
      return { received: true };
    }

    if (payment.status === "AUTHORIZED" || payment.status === "CLOSED") {
      // Capture the full amount. Only an AUTHORIZED payment can be captured; a
      // CLOSED payment was already captured (e.g. by a duplicate webhook) and
      // is just finalized here. Capture is idempotent: Tabby dedupes by the
      // reference_id we send (= order.id), and markOrderPaid guards against
      // double-finalization via the terminal-status check.
      if (payment.status === "AUTHORIZED") {
        try {
          await TabbyClient.capturePayment(
            paymentId,
            order.total.toFixed(2),
            order.id
          );
          console.log(`✅ Tabby captured payment ${paymentId} for order ${order.id}`);
        } catch (err) {
          // A concurrent webhook may have captured + closed it first. Re-fetch
          // the authoritative status before treating this as a real failure.
          const rechecked = await TabbyClient.retrievePayment(paymentId);
          if (rechecked.status === "CLOSED") {
            console.log(`Tabby payment ${paymentId} already captured (CLOSED), finalizing order ${order.id}`);
          } else {
            // Genuine capture failure: do NOT confirm the order. Surface it so
            // the AUTHORIZED payment gets captured manually within Tabby's
            // 21-day window (otherwise it is never settled).
            console.error(`❌ Tabby capture failed for order ${order.id}:`, err);
            try {
              await EmailService.sendCaptureFailureAlert({
                orderId: order.id,
                paymentId,
                provider: "Tabby",
                error: err,
              });
            } catch (alertErr) {
              console.error("Failed to send Tabby capture alert:", alertErr);
            }
            return { received: true };
          }
        }
      }
      await this.markOrderPaid(order, {
        paymentMethod: "TABBY",
        refund: (amount) =>
          TabbyClient.refundPayment(
            paymentId,
            amount.toFixed(2),
            "Insufficient stock",
            `${order.id}-refund`
          ),
      });
    } else if (
      payment.status === "REJECTED" ||
      payment.status === "EXPIRED"
    ) {
      await this.cancelPendingOrder(order, `Tabby payment ${payment.status.toLowerCase()}`);
    }

    return { received: true };
  }

  /**
   * Register the Tabby webhook endpoint with Tabby so we receive payment
   * status events. Without this, Tabby never calls /payments/tabby/webhook, so
   * AUTHORIZED payments are never captured/settled. Registered per merchant_code
   * + secret-key pair; the environment (test/live) follows the key.
   * Safe to call on every boot: Tabby allows up to 4 webhooks per pair and
   * returns the (possibly duplicate) registration. Configure the same
   * TABBY_WEBHOOK_SECRET here and in the dashboard so the handler can verify it.
   */
  static async registerTabbyWebhook(): Promise<void> {
    const merchantCode = process.env.TABBY_MERCHANT_CODE;
    if (!merchantCode || merchantCode === "your_tabby_merchant_code") {
      console.warn(
        "⚠️ TABBY_MERCHANT_CODE not set, skipping Tabby webhook registration"
      );
      return;
    }

    // Public URL of this backend's Tabby webhook endpoint.
    const webhookUrl =
      process.env.TABBY_WEBHOOK_URL ||
      (process.env.BACKEND_PUBLIC_URL
        ? `${process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "")}/api/payments/tabby/webhook`
        : "");

    if (!webhookUrl) {
      console.warn(
        "⚠️ Tabby webhook URL not configured. Set TABBY_WEBHOOK_URL or BACKEND_PUBLIC_URL (e.g. https://api.yourdomain.com) so the webhook can be registered"
      );
      return;
    }

    if (!webhookUrl.startsWith("https://")) {
      console.warn(
        `⚠️ Tabby webhook URL must be HTTPS and publicly reachable (${webhookUrl}); skipping registration`
      );
      return;
    }

    const webhookSecret = process.env.TABBY_WEBHOOK_SECRET || undefined;

    try {
      const result = await TabbyClient.registerWebhook({
        url: webhookUrl,
        merchantCode,
        secret: webhookSecret,
      });
      console.log(`✅ Tabby webhook registered: ${result.url} (id: ${result.id})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Idempotent: Tabby returns 400 "webhook already exists" when this URL was
      // registered on a previous boot — that's the desired end state, not an error.
      if (msg.includes("already exists")) {
        console.log(`✅ Tabby webhook already registered: ${webhookUrl}`);
      } else {
        console.error("❌ Tabby webhook registration error:", err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Tamara (https://docs.tamara.co)
  // ---------------------------------------------------------------------------

  private static async createTamaraCheckout(
    body: PaymentModel["checkoutBody"],
    userId?: string,
    origin?: string,
    capiCtx?: CapiContext,
    attempt?: CheckoutAttempt,
  ) {
    if (process.env.TAMARA_ENABLED === "false") {
      throw new Error("Tamara is currently unavailable. Please choose another payment method.");
    }
    const { cancelUrl, couponCode, locale } = body;
    const lang = (locale || "en") === "ar" ? "ar_SA" : "en_US";

    const { order, variants, shippingCost } = await this.prepareOrder(body, userId, "TAMARA", capiCtx, attempt);
    const contact = this.getCustomerContact(body);
    const localePath = (locale || "en") === "ar" ? "ar" : "en";
    const marketingUrl = this.resolveMarketingUrl(origin);

    const cancelUrlResolved =
      cancelUrl ||
      `${marketingUrl}/${localePath}/checkout?method=TAMARA${couponCode ? `&coupon=${couponCode.toUpperCase()}` : ""}`;

    const checkout = await TamaraClient.createCheckout({
      order_reference_id: order.id,
      total_amount: tamaraMoney(order.total, CURRENCY),
      shipping_amount: tamaraMoney(shippingCost, CURRENCY),
      tax_amount: tamaraMoney(0, CURRENCY),
      description: `Capella order ${order.id}`,
      country_code: "AE",
      payment_type: "PAY_BY_INSTALMENTS",
      platform: "Web",
      locale: lang,
      ...(order.discountAmount && order.discountAmount > 0
        ? {
            discount: {
              name: "Discount",
              amount: tamaraMoney(order.discountAmount, CURRENCY),
            },
          }
        : {}),
      items: body.items.map((item) => {
        const variant = variants.find((v) => v.id === item.variantId)!;
        const lineTotal = variant.price * item.quantity;
        return {
          reference_id: variant.sku || variant.id,
          name: variant.product.nameEn,
          type: "Physical",
          sku: variant.sku || variant.id,
          quantity: item.quantity,
          unit_price: tamaraMoney(variant.price, CURRENCY),
          total_amount: tamaraMoney(lineTotal, CURRENCY),
          image_url: variant.images[0]?.image?.url || undefined,
        };
      }),
      consumer: {
        first_name: order.shippingFirstName,
        last_name: order.shippingLastName,
        email: contact.email,
        phone_number: contact.phone,
      },
      billing_address: {
        first_name: order.shippingFirstName,
        last_name: order.shippingLastName,
        line1: order.shippingStreet,
        city: order.shippingCity,
        country_code: "AE",
        region: order.shippingState,
        phone_number: order.shippingPhone || contact.phone,
      },
      shipping_address: {
        first_name: order.shippingFirstName,
        last_name: order.shippingLastName,
        line1: order.shippingStreet,
        city: order.shippingCity,
        country_code: "AE",
        region: order.shippingState,
        phone_number: order.shippingPhone || contact.phone,
      },
      merchant_url: {
        success: `${marketingUrl}/${localePath}/checkout/success?method=TAMARA`,
        failure: cancelUrlResolved,
        cancel: cancelUrlResolved,
      },
    });

    if (!checkout.checkout_url) {
      throw new Error(
        "Tamara is not available for this order. Please choose another payment method."
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { tamaraCheckoutId: checkout.checkout_id },
    });

    return {
      paymentIntentId: checkout.checkout_id,
      url: checkout.checkout_url,
      orderId: order.id,
    };
  }

  static async handleTamaraWebhook(payload: string) {
    let event: { order_reference_id?: string };
    try {
      event = TamaraClient.parseWebhookPayload(payload);
    } catch {
      console.error("Tamara webhook: could not parse payload");
      return { received: true };
    }

    const orderReferenceId = event.order_reference_id;
    if (!orderReferenceId) {
      console.warn("Tamara webhook received without an order_reference_id");
      return { received: true };
    }

    console.log(`📩 Received Tamara Event for order ${orderReferenceId}`);

    // Always verify the status server-to-server (Tamara recommends this over
    // trusting the IPN body). order_reference_id is the merchant reference we
    // sent at checkout (= our order.id).
    const tamaraOrder = await TamaraClient.getOrderStatus(orderReferenceId);

    const order = await prisma.order.findUnique({
      where: { id: orderReferenceId },
      include: { items: true, user: true, address: true, coupon: true },
    });
    if (!order) {
      console.error(`Order not found for Tamara order ${orderReferenceId}`);
      return { received: true };
    }

    const status = tamaraOrder.status?.toLowerCase();

    if (status === "approved" || status === "authorised") {
      try {
        await TamaraClient.capturePayment(
          orderReferenceId,
          tamaraMoney(order.total, CURRENCY)
        );
      } catch (err) {
        console.error(`Tamara capture failed for order ${order.id}:`, err);
      }
      await this.markOrderPaid(order, {
        paymentMethod: "TAMARA",
        refund: (amount) =>
          TamaraClient.refundPayment(orderReferenceId, tamaraMoney(amount, CURRENCY)),
      });
    } else if (
      status === "cancelled" ||
      status === "expired" ||
      status === "rejected"
    ) {
      await this.cancelPendingOrder(order, `Tamara order ${status}`);
    }

    return { received: true };
  }
}
