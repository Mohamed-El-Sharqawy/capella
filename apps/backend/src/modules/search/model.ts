import { t, type UnwrapSchema } from "elysia";

export const SearchModel = {
  querySchema: t.Object({
    q: t.Optional(t.String({ minLength: 2 })),
    limit: t.Optional(t.String()),
  }),
  trackQueryBody: t.Object({
    query: t.String({ minLength: 1 }),
    resultsCount: t.Number({ minimum: 0 }),
    productId: t.Optional(t.String()),
    collectionId: t.Optional(t.String()),
  }),
  trackClickBody: t.Object({
    query: t.String({ minLength: 1 }),
    productId: t.Optional(t.String()),
    collectionId: t.Optional(t.String()),
    position: t.Optional(t.Number({ minimum: 0 })),
  }),
  analyticsQuery: t.Object({
    days: t.Optional(t.String()),
    limit: t.Optional(t.String()),
  }),
} as const;

export type SearchModel = {
  [K in keyof typeof SearchModel]: UnwrapSchema<(typeof SearchModel)[K]>;
};
