import { t, type UnwrapSchema } from "elysia";

export const CouponModel = {
  createBody: t.Object({
    code: t.String({ minLength: 1 }),
    discountType: t.Union([t.Literal("PERCENTAGE"), t.Literal("FIXED_AMOUNT")]),
    discountValue: t.Number({ minimum: 0 }),
    minOrderAmount: t.Optional(t.Number({ minimum: 0 })),
    maxDiscountAmount: t.Optional(t.Number({ minimum: 0 })),
    usageLimit: t.Optional(t.Number({ minimum: 1 })),
    usageLimitPerUser: t.Optional(t.Number({ minimum: 1 })),
    startsAt: t.Optional(t.String()),
    expiresAt: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
  }),
  updateBody: t.Object({
    code: t.Optional(t.String({ minLength: 1 })),
    discountType: t.Optional(t.Union([t.Literal("PERCENTAGE"), t.Literal("FIXED_AMOUNT")])),
    discountValue: t.Optional(t.Number({ minimum: 0 })),
    minOrderAmount: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
    maxDiscountAmount: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
    usageLimit: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
    usageLimitPerUser: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
    startsAt: t.Optional(t.Nullable(t.String())),
    expiresAt: t.Optional(t.Nullable(t.String())),
    isActive: t.Optional(t.Boolean()),
  }),
  validateBody: t.Object({
    code: t.String({ minLength: 1 }),
    orderTotal: t.Number({ minimum: 0 }),
    userId: t.Optional(t.String()),
  }),
} as const;

export type CouponModel = {
  [K in keyof typeof CouponModel]: UnwrapSchema<(typeof CouponModel)[K]>;
};
