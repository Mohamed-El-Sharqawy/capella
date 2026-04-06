import { t, type UnwrapSchema } from "elysia";

export const CartModel = {
  addItemBody: t.Object({
    variantId: t.String(),
    quantity: t.Number({ minimum: 1, default: 1 }),
  }),
  updateItemBody: t.Object({
    quantity: t.Number({ minimum: 1 }),
  }),
} as const;

export type CartModel = {
  [K in keyof typeof CartModel]: UnwrapSchema<(typeof CartModel)[K]>;
};
