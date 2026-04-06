import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { ColorService } from "./service";
import { ColorModel } from "./model";

export const color = new Elysia({ prefix: "/colors" })
  .get("/", async () => {
    const colors = await ColorService.list();
    return { success: true as const, data: colors };
  })
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const col = await ColorService.create(body);
    return status(201, { success: true as const, data: col });
  }, { isEditor: true, body: ColorModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const col = await ColorService.update(params.id, body);
    if (!col) return status(404, { success: false as const, error: "Color not found" });
    return { success: true as const, data: col };
  }, { isEditor: true, body: ColorModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await ColorService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Color not found" });
    return { success: true as const, message: "Color deleted" };
  }, { isAdmin: true });
