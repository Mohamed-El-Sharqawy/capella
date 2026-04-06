import { Elysia, status, t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { BannerService } from "./service";
import { BannerModel } from "./model";

export const banner = new Elysia({ prefix: "/banners" })
  // Public routes - get active banners for frontend
  .get("/", async ({ query }) => {
    const banners = await BannerService.list(query);
    return { success: true as const, data: banners };
  }, { query: BannerModel.listQuery })
  .get("/:id", async ({ params }) => {
    const banner = await BannerService.getById(params.id);
    if (!banner) return status(404, { success: false as const, error: "Banner not found" });
    return { success: true as const, data: banner };
  })
  // Admin/Editor routes
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const banner = await BannerService.create(body);
    return status(201, { success: true as const, data: banner });
  }, { isEditor: true, body: BannerModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const banner = await BannerService.update(params.id, body);
    if (!banner) return status(404, { success: false as const, error: "Banner not found" });
    return { success: true as const, data: banner };
  }, { isEditor: true, body: BannerModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await BannerService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Banner not found" });
    return { success: true as const, message: "Banner deleted" };
  }, { isAdmin: true })
  .post("/reorder", async ({ body }) => {
    await BannerService.reorder(body.ids);
    return { success: true as const, message: "Banners reordered" };
  }, { isEditor: true, body: t.Object({ ids: t.Array(t.String()) }) });
