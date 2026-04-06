import { t } from "elysia";

export abstract class BannerModel {
  static readonly createBody = t.Object({
    titleEn: t.String({ minLength: 1 }),
    titleAr: t.String({ minLength: 1 }),
    subtitleEn: t.Optional(t.String()),
    subtitleAr: t.Optional(t.String()),
    buttonTextEn: t.Optional(t.String()),
    buttonTextAr: t.Optional(t.String()),
    imageUrl: t.String({ minLength: 1 }),
    publicId: t.String({ minLength: 1 }),
    linkUrl: t.Optional(t.String()),
    position: t.Optional(t.Number({ minimum: 0 })),
    isActive: t.Optional(t.Boolean()),
  });

  static readonly updateBody = t.Object({
    titleEn: t.Optional(t.String({ minLength: 1 })),
    titleAr: t.Optional(t.String({ minLength: 1 })),
    subtitleEn: t.Optional(t.String()),
    subtitleAr: t.Optional(t.String()),
    buttonTextEn: t.Optional(t.String()),
    buttonTextAr: t.Optional(t.String()),
    imageUrl: t.Optional(t.String({ minLength: 1 })),
    publicId: t.Optional(t.String({ minLength: 1 })),
    linkUrl: t.Optional(t.String()),
    position: t.Optional(t.Number({ minimum: 0 })),
    isActive: t.Optional(t.Boolean()),
  });

  static readonly listQuery = t.Object({
    isActive: t.Optional(t.String()), // "true" or "false"
  });
}
