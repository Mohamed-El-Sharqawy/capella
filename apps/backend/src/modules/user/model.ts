import { t, type UnwrapSchema } from "elysia";

export const UserModel = {
  updateProfile: t.Object({
    firstName: t.Optional(t.String({ minLength: 1 })),
    lastName: t.Optional(t.String({ minLength: 1 })),
    phone: t.Optional(t.String()),
    avatar: t.Optional(t.String()),
  }),
  createAddress: t.Object({
    label: t.Optional(t.String()),
    firstName: t.String({ minLength: 1 }),
    lastName: t.String({ minLength: 1 }),
    street: t.String({ minLength: 1 }),
    city: t.String({ minLength: 1 }),
    state: t.String({ minLength: 1 }),
    zipCode: t.String({ minLength: 1 }),
    country: t.String({ minLength: 1 }),
    phone: t.Optional(t.String()),
    isDefault: t.Optional(t.Boolean()),
  }),
  updateAddress: t.Object({
    label: t.Optional(t.String()),
    firstName: t.Optional(t.String({ minLength: 1 })),
    lastName: t.Optional(t.String({ minLength: 1 })),
    street: t.Optional(t.String({ minLength: 1 })),
    city: t.Optional(t.String({ minLength: 1 })),
    state: t.Optional(t.String({ minLength: 1 })),
    zipCode: t.Optional(t.String({ minLength: 1 })),
    country: t.Optional(t.String({ minLength: 1 })),
    phone: t.Optional(t.String()),
    isDefault: t.Optional(t.Boolean()),
  }),
  paginationQuery: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
  }),
} as const;

export type UserModel = {
  [K in keyof typeof UserModel]: UnwrapSchema<(typeof UserModel)[K]>;
};
