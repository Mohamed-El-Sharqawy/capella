import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { PaymentService } from "./service";
import { PaymentModel } from "./model";
import { extractCapiContext } from "../../lib/meta-capi";

export const payment = new Elysia({ prefix: "/payments" })
  .use(authPlugin)
  // Public: which payment methods are enabled (drives frontend visibility).
  .get("/methods", () => ({
    success: true as const,
    data: PaymentService.getEnabledMethods(),
  }))
  // Background pre-scoring for Tabby — determines eligibility before showing
  // the Tabby option. Public (guests can check out) and fail-safe.
  .post("/tabby/eligibility", async ({ body }) => {
    try {
      const result = await PaymentService.checkTabbyEligibility(
        body as { amount: number; email?: string; phone?: string }
      );
      return { success: true as const, data: result };
    } catch (error) {
      // Never block checkout on a scoring error — default to available.
      const message = error instanceof Error ? error.message : "Eligibility check failed";
      console.warn("Tabby eligibility endpoint error:", message);
      return { success: true as const, data: { available: true } };
    }
  }, { body: PaymentModel.tabbyEligibilityBody })
  // Public: order status by Tabby payment id. Lets the success page verify the
  // order was paid (CONFIRMED) before clearing the cart.
  .get("/tabby/status", async ({ query, set }) => {
    const paymentId = (query as { payment_id?: string }).payment_id;
    if (!paymentId) {
      set.status = 400;
      return { success: false as const, error: "payment_id is required" };
    }
    const orderStatus = await PaymentService.getTabbyOrderStatus(paymentId);
    return { success: true as const, data: { orderStatus } };
  })
  // Public: order status by order id. Lets the success page verify an online
  // payment (Ziina/Tabby/Tamara) was confirmed by the webhook before firing the
  // browser Purchase event. Order IDs are unguessable cuids; only status is
  // returned (no PII), so this is safe to expose without auth.
  .get("/order-status", async ({ query, set }) => {
    const orderId = (query as { orderId?: string }).orderId;
    if (!orderId) {
      set.status = 400;
      return { success: false as const, error: "orderId is required" };
    }
    const orderStatus = await PaymentService.getOrderStatus(orderId);
    return { success: true as const, data: { orderStatus } };
  })
  .post("/checkout", async ({ body, user, headers, request }) => {
    try {
      const result = await PaymentService.createCheckoutSession(
        body,
        user?.id,
        headers.origin,
        extractCapiContext(request),
      );
      return { success: true as const, data: result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout failed";
      return status(400, { success: false as const, error: message });
    }
  }, { optionalAuth: true, body: PaymentModel.checkoutBody })
  .post("/webhook", async ({ headers, body, set }) => {
    const sig = headers["x-hmac-signature"];

    if (!sig) {
      console.error(
        "❌ Webhook Error: Missing X-Hmac-Signature header"
      );
      set.status = 400;
      return { success: false, error: "Missing signature" };
    }

    const clientIp =
      headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      headers["x-real-ip"] ||
      "";

    try {
      const result = await PaymentService.handleWebhook(
        body as string,
        sig,
        clientIp
      );
      console.log(`✅ Webhook processed successfully`);
      return result;
    } catch (error: any) {
      console.error("❌ Webhook Error:", error.message);
      set.status = 400;
      return { success: false, error: error.message };
    }
  }, {
    parse: "text",
  })
  .post("/tabby/webhook", async ({ headers, body, set }) => {
    const sig = headers["x-tabby-auth"];
    // Behind Cloudflare/CDN the socket peer is the edge (e.g. 162.158.x.x), not
    // Tabby's server, so the IP allowlist would always warn. CF-Connecting-IP
    // is the true origin client and matches Tabby's published server IPs.
    const clientIp =
      headers["cf-connecting-ip"] ||
      headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      headers["x-real-ip"] ||
      "";

    try {
      const result = await PaymentService.handleTabbyWebhook(
        body as string,
        sig,
        clientIp
      );
      return result;
    } catch (error: any) {
      console.error("❌ Tabby Webhook Error:", error.message);
      set.status = 400;
      return { success: false, error: error.message };
    }
  }, {
    parse: "text",
  })
  .post("/tamara/webhook", async ({ body, set }) => {
    try {
      const result = await PaymentService.handleTamaraWebhook(body as string);
      return result;
    } catch (error: any) {
      console.error("❌ Tamara Webhook Error:", error.message);
      set.status = 400;
      return { success: false, error: error.message };
    }
  }, {
    parse: "text",
  });
