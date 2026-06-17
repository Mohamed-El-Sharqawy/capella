import { Elysia } from "elysia";
import { MetaCatalogService } from "./service";

const TOKEN = process.env.META_FEED_TOKEN;

export const metaCatalogFeed = new Elysia().get(
  "/feeds/meta-products.csv",
  async ({ query, set }) => {
    if (!TOKEN) {
      set.status = 503;
      return "Feed disabled: META_FEED_TOKEN is not configured";
    }

    if (query.token !== TOKEN) {
      set.status = 404;
      return "Not Found";
    }

    const body = await MetaCatalogService.getFeed();

    set.headers["Content-Type"] = "text/tab-separated-values; charset=utf-8";
    set.headers["Cache-Control"] = "public, max-age=300";
    set.headers["Content-Disposition"] = 'inline; filename="meta-products.csv"';

    return body;
  }
);
