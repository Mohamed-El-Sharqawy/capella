import { t } from "elysia";

export const InstagramPostModel = {
  create: t.Object({
    linkUrl: t.Optional(t.String()),
    altEn: t.Optional(t.String()),
    altAr: t.Optional(t.String()),
    position: t.Optional(t.Number()),
    isActive: t.Optional(t.Boolean()),
  }),
  update: t.Object({
    linkUrl: t.Optional(t.String()),
    altEn: t.Optional(t.String()),
    altAr: t.Optional(t.String()),
    position: t.Optional(t.Number()),
    isActive: t.Optional(t.Boolean()),
  }),
  params: t.Object({
    id: t.String(),
  }),
};
