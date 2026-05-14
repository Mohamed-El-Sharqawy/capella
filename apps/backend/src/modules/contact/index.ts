import { Elysia, status } from "elysia";
import { ContactModel } from "./model";
import { EmailService } from "../email/service";
import { sendMetaEvent } from "../../lib/meta-capi";

export const contact = new Elysia({ prefix: "/contact" }).post(
  "/",
  async ({ body, request }) => {
    const userAgent = request.headers.get("user-agent") || undefined;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;

    await Promise.all([
      EmailService.sendContactNotification({
        name: body.name,
        email: body.email,
        phone: body.phone,
        subject: body.subject,
        message: body.message,
      }),
      sendMetaEvent({
        eventName: "Lead",
        email: body.email,
        phone: body.phone,
        firstName: body.name.split(" ")[0],
        lastName: body.name.split(" ").slice(1).join(" ") || undefined,
        userAgent,
        ip,
        eventId: body.eventId,
        fbp: body.fbp,
        fbc: body.fbc,
      }),
    ]);

    return status(200, { success: true as const });
  },
  { body: ContactModel.contactBody }
);
