import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { ClarityService } from "./service";
import { ClarityModel } from "./model";

export const clarity = new Elysia({ prefix: "/clarities" })
  .get("/", async () => {
    const clarities = await ClarityService.list();
    return { success: true as const, data: clarities };
  })
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const cl = await ClarityService.create(body);
    return status(201, { success: true as const, data: cl });
  }, { isEditor: true, body: ClarityModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const cl = await ClarityService.update(params.id, body);
    if (!cl) return status(404, { success: false as const, error: "Clarity not found" });
    return { success: true as const, data: cl };
  }, { isEditor: true, body: ClarityModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await ClarityService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Clarity not found" });
    return { success: true as const, message: "Clarity deleted" };
  }, { isAdmin: true });
