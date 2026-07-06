import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { PaymentService } from "./service";
import { PaymentModel } from "./model";

export const payment = new Elysia({ prefix: "/payments" })
  .use(authPlugin)
  // Public: which payment methods are enabled (drives frontend visibility).
  .get("/methods", () => ({
    success: true as const,
    data: PaymentService.getEnabledMethods(),
  }))
  .post("/checkout", async ({ body, user }) => {
    try {
      const result = await PaymentService.createCheckoutSession(
        body,
        user?.id
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
    const clientIp =
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
