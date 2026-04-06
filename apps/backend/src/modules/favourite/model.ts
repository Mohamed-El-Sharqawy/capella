import { t, type UnwrapSchema } from "elysia";

export const FavouriteModel = {
  addBody: t.Object({
    productId: t.String(),
  }),
} as const;

export type FavouriteModel = {
  [K in keyof typeof FavouriteModel]: UnwrapSchema<(typeof FavouriteModel)[K]>;
};
