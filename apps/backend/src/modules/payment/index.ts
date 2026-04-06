import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { PaymentService } from "./service";
import { PaymentModel } from "./model";

export const payment = new Elysia({ prefix: "/payments" })
  .use(authPlugin)
  // Create checkout session (public - can be guest or authenticated)
  .post("/checkout", async ({ body, user }) => {
    try {
      const result = await PaymentService.createCheckoutSession(
        body,
        user?.id
      );
      return { success: true as const, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      return status(400, { success: false as const, error: message });
    }
  }, { optionalAuth: true, body: PaymentModel.checkoutBody })
  // Stripe webhook endpoint (no auth required - verified by signature)
  .post("/webhook", async ({ body, headers }) => {
    const signature = headers["stripe-signature"];
    if (!signature) {
      return status(400, { success: false as const, error: "Missing stripe-signature header" });
    }

    try {
      // Get raw body for signature verification
      const rawBody = JSON.stringify(body);
      const result = await PaymentService.handleWebhook(rawBody, signature);
      return { success: true as const, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook processing failed";
      console.error("Webhook error:", message);
      return status(400, { success: false as const, error: message });
    }
  }, {
    // Skip body parsing to get raw body for Stripe signature verification
    // Note: In production, you may need to configure this differently
    parse: "json",
  });
