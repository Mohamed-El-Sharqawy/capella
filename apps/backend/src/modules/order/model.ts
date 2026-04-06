import { t, type UnwrapSchema } from "elysia";

export const OrderModel = {
  createBody: t.Object({
    items: t.Array(
      t.Object({
        variantId: t.String(),
        quantity: t.Number({ minimum: 1 }),
      })
    ),
    shippingFirstName: t.String({ minLength: 1 }),
    shippingLastName: t.String({ minLength: 1 }),
    shippingStreet: t.String({ minLength: 1 }),
    shippingCity: t.String({ minLength: 1 }),
    shippingState: t.String({ minLength: 1 }),
    shippingZipCode: t.String({ minLength: 1 }),
    shippingCountry: t.String({ minLength: 1 }),
    shippingPhone: t.Optional(t.String()),
    shippingCost: t.Optional(t.Number({ minimum: 0 })),
    note: t.Optional(t.String()),
    // Guest fields (required when not logged in)
    guestEmail: t.Optional(t.String({ format: "email" })),
    guestFirstName: t.Optional(t.String()),
    guestLastName: t.Optional(t.String()),
    guestPhone: t.Optional(t.String()),
    // Address ID for logged-in users
    addressId: t.Optional(t.String()),
    // Coupon data
    couponCode: t.Optional(t.String()),
    discountAmount: t.Optional(t.Number({ minimum: 0 })),
  }),
  updateStatusBody: t.Object({
    status: t.Union([
      t.Literal("PENDING"),
      t.Literal("CONFIRMED"),
      t.Literal("PROCESSING"),
      t.Literal("SHIPPED"),
      t.Literal("DELIVERED"),
      t.Literal("CANCELLED"),
      t.Literal("REFUNDED"),
    ]),
  }),
  listQuery: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    status: t.Optional(t.String()),
  }),
} as const;

export type OrderModel = {
  [K in keyof typeof OrderModel]: UnwrapSchema<(typeof OrderModel)[K]>;
};
