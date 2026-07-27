import { Elysia, status } from "elysia";
import { ContactModel } from "./model";
import { EmailService } from "../email/service";
import { sendMetaEvent, extractCapiContext } from "../../lib/meta-capi";

export const contact = new Elysia({ prefix: "/contact" }).post(
  "/",
  async ({ body, request }) => {
    const capiCtx = extractCapiContext(request);

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
        userAgent: capiCtx.clientUserAgent,
        ip: capiCtx.clientIpAddress,
        eventId: capiCtx.eventId || body.eventId,
        fbp: capiCtx.fbp || body.fbp,
        fbc: capiCtx.fbc || body.fbc,
      }),
    ]);

    return status(200, { success: true as const });
  },
  { body: ContactModel.contactBody }
);
