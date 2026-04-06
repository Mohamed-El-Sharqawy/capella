import { t, type UnwrapSchema } from "elysia";

export const WishlistModel = {
  addBody: t.Object({
    productId: t.String(),
    note: t.Optional(t.String()),
  }),
  updateBody: t.Object({
    note: t.Optional(t.String()),
  }),
} as const;

export type WishlistModel = {
  [K in keyof typeof WishlistModel]: UnwrapSchema<(typeof WishlistModel)[K]>;
};
