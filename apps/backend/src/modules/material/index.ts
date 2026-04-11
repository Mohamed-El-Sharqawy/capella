import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { MaterialService } from "./service";
import { MaterialModel } from "./model";

export const material = new Elysia({ prefix: "/materials" })
  .get("/", async () => {
    const materials = await MaterialService.list();
    return { success: true as const, data: materials };
  })
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const mat = await MaterialService.create(body);
    return status(201, { success: true as const, data: mat });
  }, { isEditor: true, body: MaterialModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const mat = await MaterialService.update(params.id, body);
    if (!mat) return status(404, { success: false as const, error: "Material not found" });
    return { success: true as const, data: mat };
  }, { isEditor: true, body: MaterialModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await MaterialService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Material not found" });
    return { success: true as const, message: "Material deleted" };
  }, { isAdmin: true });
