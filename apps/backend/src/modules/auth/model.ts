import { t, type UnwrapSchema } from "elysia";

export const AuthModel = {
  signUpBody: t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 }),
    firstName: t.String({ minLength: 1 }),
    lastName: t.String({ minLength: 1 }),
  }),
  signInBody: t.Object({
    email: t.String({ format: "email" }),
    password: t.String(),
  }),
  refreshBody: t.Object({
    refreshToken: t.String(),
  }),
  authResponse: t.Object({
    success: t.Literal(true),
    data: t.Object({
      user: t.Object({
        id: t.String(),
        email: t.String(),
        firstName: t.String(),
        lastName: t.String(),
        role: t.String(),
      }),
      accessToken: t.String(),
      refreshToken: t.String(),
    }),
  }),
  tokenResponse: t.Object({
    success: t.Literal(true),
    data: t.Object({
      accessToken: t.String(),
      refreshToken: t.String(),
    }),
  }),
  error: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
} as const;

export type AuthModel = {
  [K in keyof typeof AuthModel]: UnwrapSchema<(typeof AuthModel)[K]>;
};
