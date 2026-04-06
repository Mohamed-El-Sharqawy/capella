import { t } from "elysia";

export const ShoppableVideoModel = {
  create: t.Object({
    productId: t.String(),
    position: t.Optional(t.Number()),
    isActive: t.Optional(t.Boolean()),
  }),
  update: t.Object({
    productId: t.Optional(t.String()),
    position: t.Optional(t.Number()),
    isActive: t.Optional(t.Boolean()),
  }),
  params: t.Object({
    id: t.String(),
  }),
};
