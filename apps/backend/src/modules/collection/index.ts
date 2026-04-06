import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { CollectionService } from "./service";
import { CollectionModel } from "./model";

export const collection = new Elysia({ prefix: "/collections" })
  // Public routes
  .get("/", async () => {
    const collections = await CollectionService.list();
    return { success: true as const, data: collections };
  })
  .get("/header", async () => {
    const collections = await CollectionService.listForHeader();
    return { success: true as const, data: collections };
  })
  .get("/all", async () => {
    // Flat list of all collections for product form dropdown
    const collections = await CollectionService.listAll();
    return { success: true as const, data: collections };
  })
  .get("/featured-home", async () => {
    // Collections featured on homepage hero section
    const collections = await CollectionService.listFeaturedOnHome();
    return { success: true as const, data: collections };
  })
  .get("/:slugOrId", async ({ params }) => {
    // Try by slug first, then by ID
    let col: any = await CollectionService.getBySlug(params.slugOrId);
    if (!col) {
      col = await CollectionService.getById(params.slugOrId);
    }
    if (!col) return status(404, { success: false as const, error: "Collection not found" });
    return { success: true as const, data: col };
  })
  // Admin/Editor routes
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const col = await CollectionService.create(body);
    return status(201, { success: true as const, data: col });
  }, { isEditor: true, body: CollectionModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const col = await CollectionService.update(params.id, body);
    if (!col) return status(404, { success: false as const, error: "Collection not found" });
    return { success: true as const, data: col };
  }, { isEditor: true, body: CollectionModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await CollectionService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Collection not found" });
    return { success: true as const, message: "Collection deleted" };
  }, { isAdmin: true });
