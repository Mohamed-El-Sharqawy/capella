import { t, type UnwrapSchema } from "elysia";

export const ColorModel = {
  createBody: t.Object({
    nameEn: t.String({ minLength: 1 }),
    nameAr: t.String({ minLength: 1 }),
    hex: t.String({ minLength: 4 }),
  }),
  updateBody: t.Object({
    nameEn: t.Optional(t.String({ minLength: 1 })),
    nameAr: t.Optional(t.String({ minLength: 1 })),
    hex: t.Optional(t.String({ minLength: 4 })),
  }),
} as const;

export type ColorModel = {
  [K in keyof typeof ColorModel]: UnwrapSchema<(typeof ColorModel)[K]>;
};
