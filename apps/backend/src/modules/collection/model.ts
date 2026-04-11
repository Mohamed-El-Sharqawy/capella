import { t, type UnwrapSchema } from "elysia";

export const CollectionModel = {
  createBody: t.Object({
    nameEn: t.String({ minLength: 1 }),
    nameAr: t.String({ minLength: 1 }),
    descriptionEn: t.Optional(t.String()),
    descriptionAr: t.Optional(t.String()),
    metaTitleEn: t.Optional(t.String()),
    metaTitleAr: t.Optional(t.String()),
    metaDescriptionEn: t.Optional(t.String()),
    metaDescriptionAr: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    inHeader: t.Optional(t.Boolean()),
    isFeaturedOnHome: t.Optional(t.Boolean()),
    homeFeaturedPosition: t.Optional(t.Number()),
    position: t.Optional(t.Number()),
    parentId: t.Optional(t.Union([t.String(), t.Null()])),
    // Banner fields
    bannerTitleEn: t.Optional(t.String()),
    bannerTitleAr: t.Optional(t.String()),
    bannerDescriptionEn: t.Optional(t.String()),
    bannerDescriptionAr: t.Optional(t.String()),
    bannerCtaTextEn: t.Optional(t.String()),
    bannerCtaTextAr: t.Optional(t.String()),
  }),
  updateBody: t.Object({
    nameEn: t.Optional(t.String({ minLength: 1 })),
    nameAr: t.Optional(t.String({ minLength: 1 })),
    descriptionEn: t.Optional(t.String()),
    descriptionAr: t.Optional(t.String()),
    metaTitleEn: t.Optional(t.String()),
    metaTitleAr: t.Optional(t.String()),
    metaDescriptionEn: t.Optional(t.String()),
    metaDescriptionAr: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    inHeader: t.Optional(t.Boolean()),
    isFeaturedOnHome: t.Optional(t.Boolean()),
    homeFeaturedPosition: t.Optional(t.Number()),
    position: t.Optional(t.Number()),
    parentId: t.Optional(t.Union([t.String(), t.Null()])),
    // Banner fields
    bannerTitleEn: t.Optional(t.String()),
    bannerTitleAr: t.Optional(t.String()),
    bannerDescriptionEn: t.Optional(t.String()),
    bannerDescriptionAr: t.Optional(t.String()),
    bannerCtaTextEn: t.Optional(t.String()),
    bannerCtaTextAr: t.Optional(t.String()),
  }),
} as const;

export type CollectionModel = {
  [K in keyof typeof CollectionModel]: UnwrapSchema<(typeof CollectionModel)[K]>;
};
