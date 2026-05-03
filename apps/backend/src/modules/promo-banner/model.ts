import { t } from "elysia";

export abstract class PromoBannerModel {
  static readonly createBody = t.Object({
    titleEn: t.String({ minLength: 1 }),
    titleAr: t.String({ minLength: 1 }),
    buttonTextEn: t.String({ minLength: 1 }),
    buttonTextAr: t.String({ minLength: 1 }),
    linkUrl: t.String({ minLength: 1 }),
    imageUrl: t.String({ minLength: 1 }),
    publicId: t.String({ minLength: 1 }),
    position: t.Optional(t.Number({ minimum: 0 })),
    isActive: t.Optional(t.Boolean()),
  });

  static readonly updateBody = t.Object({
    titleEn: t.Optional(t.String({ minLength: 1 })),
    titleAr: t.Optional(t.String({ minLength: 1 })),
    buttonTextEn: t.Optional(t.String({ minLength: 1 })),
    buttonTextAr: t.Optional(t.String({ minLength: 1 })),
    linkUrl: t.Optional(t.String({ minLength: 1 })),
    imageUrl: t.Optional(t.String({ minLength: 1 })),
    publicId: t.Optional(t.String({ minLength: 1 })),
    position: t.Optional(t.Number({ minimum: 0 })),
    isActive: t.Optional(t.Boolean()),
  });

  static readonly listQuery = t.Object({
    isActive: t.Optional(t.String()),
  });
}
