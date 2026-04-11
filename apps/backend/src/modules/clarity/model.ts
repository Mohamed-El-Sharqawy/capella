import { t, type UnwrapSchema } from "elysia";

export const ClarityModel = {
  createBody: t.Object({
    nameEn: t.String({ minLength: 1 }),
    nameAr: t.String({ minLength: 1 }),
    position: t.Optional(t.Number({ minimum: 0 })),
  }),
  updateBody: t.Object({
    nameEn: t.Optional(t.String({ minLength: 1 })),
    nameAr: t.Optional(t.String({ minLength: 1 })),
    position: t.Optional(t.Number({ minimum: 0 })),
  }),
} as const;

export type ClarityModel = {
  [K in keyof typeof ClarityModel]: UnwrapSchema<(typeof ClarityModel)[K]>;
};
