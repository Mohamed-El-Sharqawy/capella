import { t } from "elysia";

export const ReviewModel = {
  create: t.Object({
    productId: t.String(),
    title: t.String(),
    content: t.String(),
    rating: t.Number({ minimum: 1, maximum: 5 }),
    customerName: t.Optional(t.String()),
  }),

  update: t.Object({
    title: t.Optional(t.String()),
    content: t.Optional(t.String()),
    rating: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
    isApproved: t.Optional(t.Boolean()),
    isActive: t.Optional(t.Boolean()),
  }),
};
