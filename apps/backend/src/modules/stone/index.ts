import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { StoneService } from "./service";
import { StoneModel } from "./model";

export const stone = new Elysia({ prefix: "/stones" })
  .get("/", async () => {
    const stones = await StoneService.list();
    return { success: true as const, data: stones };
  })
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const st = await StoneService.create(body);
    return status(201, { success: true as const, data: st });
  }, { isEditor: true, body: StoneModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const st = await StoneService.update(params.id, body);
    if (!st) return status(404, { success: false as const, error: "Stone not found" });
    return { success: true as const, data: st };
  }, { isEditor: true, body: StoneModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await StoneService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Stone not found" });
    return { success: true as const, message: "Stone deleted" };
  }, { isAdmin: true });
