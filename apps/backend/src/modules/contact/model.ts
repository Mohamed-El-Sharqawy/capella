import { t, type UnwrapSchema } from "elysia";

export const ContactModel = {
  contactBody: t.Object({
    name: t.String({ minLength: 1 }),
    email: t.String({ format: "email" }),
    phone: t.Optional(t.String()),
    subject: t.String({ minLength: 1 }),
    message: t.String({ minLength: 1 }),
    eventId: t.Optional(t.String()),
    fbp: t.Optional(t.String()),
    fbc: t.Optional(t.String()),
  }),
} as const;

export type ContactModel = {
  [K in keyof typeof ContactModel]: UnwrapSchema<(typeof ContactModel)[K]>;
};
