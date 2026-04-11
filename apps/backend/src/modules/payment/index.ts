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
  .post("/webhook", async ({ headers, body, set }) => {
    const sig = headers["stripe-signature"];

    if (!sig) {
      console.error("❌ Webhook Error: Missing stripe-signature header");
      set.status = 400;
      return { success: false, error: "Missing signature" };
    }

    try {
      // Body is already a string because of parse: 'text'
      const result = await PaymentService.handleWebhook(body as string, sig);
      console.log(`✅ Webhook processed successfully`);
      return result;
    } catch (error: any) {
      console.error("❌ Webhook Error:", error.message);
      set.status = 400;
      return { success: false, error: error.message };
    }
  }, {
    parse: "text",
  });
