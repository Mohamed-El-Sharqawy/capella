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
  updateWithFiles: t.Object({
    productId: t.Optional(t.String()),
    position: t.Optional(t.Number()),
    isActive: t.Optional(t.Boolean()),
    video: t.Optional(t.File()),
    thumbnail: t.Optional(t.File()),
  }),
  params: t.Object({
    id: t.String(),
  }),
};
