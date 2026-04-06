import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { SizeService } from "./service";
import { SizeModel } from "./model";

export const size = new Elysia({ prefix: "/sizes" })
  .get("/", async () => {
    const sizes = await SizeService.list();
    return { success: true as const, data: sizes };
  })
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const sz = await SizeService.create(body);
    return status(201, { success: true as const, data: sz });
  }, { isEditor: true, body: SizeModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const sz = await SizeService.update(params.id, body);
    if (!sz) return status(404, { success: false as const, error: "Size not found" });
    return { success: true as const, data: sz };
  }, { isEditor: true, body: SizeModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await SizeService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Size not found" });
    return { success: true as const, message: "Size deleted" };
  }, { isAdmin: true });
