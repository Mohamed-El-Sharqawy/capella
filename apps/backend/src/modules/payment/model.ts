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
    // Shipping address
    shippingFirstName: t.String({ minLength: 1 }),
    shippingLastName: t.String({ minLength: 1 }),
    shippingStreet: t.String({ minLength: 1 }),
    shippingCity: t.String({ minLength: 1 }),
    shippingState: t.String({ minLength: 1 }),
    shippingZipCode: t.String({ minLength: 1 }),
    shippingCountry: t.String({ minLength: 1 }),
    shippingPhone: t.Optional(t.String()),
    // Guest info (for non-authenticated users)
    guestEmail: t.Optional(t.String({ format: "email" })),
    guestFirstName: t.Optional(t.String()),
    guestLastName: t.Optional(t.String()),
    guestPhone: t.Optional(t.String()),
    // Coupon
    couponCode: t.Optional(t.String()),
    // Address ID (for authenticated users with saved address)
    addressId: t.Optional(t.String()),
    note: t.Optional(t.String()),
    locale: t.Optional(t.String()),
  }),
  webhookHeaders: t.Object({
    "stripe-signature": t.String(),
  }),
} as const;

export type PaymentModel = {
  [K in keyof typeof PaymentModel]: UnwrapSchema<(typeof PaymentModel)[K]>;
};
