import { Elysia, status, t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { PromoBannerService } from "./service";
import { PromoBannerModel } from "./model";

export const promoBanner = new Elysia({ prefix: "/promo-banners" })
  .get("/", async ({ query }) => {
    const banners = await PromoBannerService.list(query);
    return { success: true as const, data: banners };
  }, { query: PromoBannerModel.listQuery })
  .get("/:id", async ({ params }) => {
    const banner = await PromoBannerService.getById(params.id);
    if (!banner) return status(404, { success: false as const, error: "Promo banner not found" });
    return { success: true as const, data: banner };
  })
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const banner = await PromoBannerService.create(body);
    return status(201, { success: true as const, data: banner });
  }, { isEditor: true, body: PromoBannerModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const banner = await PromoBannerService.update(params.id, body);
    if (!banner) return status(404, { success: false as const, error: "Promo banner not found" });
    return { success: true as const, data: banner };
  }, { isEditor: true, body: PromoBannerModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await PromoBannerService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Promo banner not found" });
    return { success: true as const, message: "Promo banner deleted" };
  }, { isAdmin: true })
  .post("/reorder", async ({ body }) => {
    await PromoBannerService.reorder(body.ids);
    return { success: true as const, message: "Promo banners reordered" };
  }, { isEditor: true, body: t.Object({ ids: t.Array(t.String()) }) });
