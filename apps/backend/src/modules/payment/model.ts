import { t, type UnwrapSchema } from "elysia";

export const PaymentModel = {
  checkoutBody: t.Object({
    items: t.Array(
      t.Object({
        variantId: t.String(),
        quantity: t.Number({ minimum: 1 }),
      })
    ),
    customerEmail: t.Optional(t.String({ format: "email" })),
    successUrl: t.Optional(t.String()),
    cancelUrl: t.Optional(t.String()),
    shippingFirstName: t.String({ minLength: 1 }),
    shippingLastName: t.String({ minLength: 1 }),
    shippingStreet: t.String({ minLength: 1 }),
    shippingCity: t.String({ minLength: 1 }),
    shippingState: t.String({ minLength: 1 }),
    shippingZipCode: t.String({ minLength: 1 }),
    shippingCountry: t.String({ minLength: 1 }),
    shippingPhone: t.Optional(t.String()),
    guestEmail: t.Optional(t.String({ format: "email" })),
    guestFirstName: t.Optional(t.String()),
    guestLastName: t.Optional(t.String()),
    guestPhone: t.Optional(t.String()),
    couponCode: t.Optional(t.String()),
    addressId: t.Optional(t.String()),
    note: t.Optional(t.String()),
    locale: t.Optional(t.String()),
    fbp: t.Optional(t.String()),
    fbc: t.Optional(t.String()),
  }),
  webhookHeaders: t.Object({
    "x-hmac-signature": t.String(),
  }),
} as const;

export type PaymentModel = {
  [K in keyof typeof PaymentModel]: UnwrapSchema<(typeof PaymentModel)[K]>;
};
