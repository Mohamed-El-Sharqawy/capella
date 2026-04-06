import { t, type UnwrapSchema } from "elysia";

export const ImageModel = {
  uploadVariantImages: t.Object({
    files: t.Files({ type: "image", maxSize: "5m" }),
    altEn: t.Optional(t.String()),
    altAr: t.Optional(t.String()),
  }),
  updateVariantImage: t.Object({
    altEn: t.Optional(t.String()),
    altAr: t.Optional(t.String()),
    position: t.Optional(t.Number()),
  }),
  updateImageAlt: t.Object({
    altEn: t.Optional(t.String()),
    altAr: t.Optional(t.String()),
  }),
  linkImage: t.Object({
    imageId: t.String(),
    variantId: t.String(),
    position: t.Optional(t.Number()),
  }),
  linkImageMultiple: t.Object({
    imageId: t.String(),
    variantIds: t.Array(t.String()),
  }),
  updatePosition: t.Object({
    position: t.Number(),
  }),
  reorderImages: t.Object({
    imageIds: t.Array(t.String()),
  }),
  uploadSizeGuide: t.Object({
    file: t.File({ type: "image", maxSize: "5m" }),
  }),
  uploadCollectionImage: t.Object({
    file: t.File({ type: "image", maxSize: "5m" }),
    altEn: t.Optional(t.String()),
    altAr: t.Optional(t.String()),
  }),
  uploadGeneric: t.Object({
    file: t.File({ type: "image", maxSize: "10m" }),
    folder: t.String(),
  }),
} as const;

export type ImageModel = {
  [K in keyof typeof ImageModel]: UnwrapSchema<(typeof ImageModel)[K]>;
};
