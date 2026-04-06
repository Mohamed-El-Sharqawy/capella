import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { ProductService } from "./service";
import { ProductModel } from "./model";

export const product = new Elysia({ prefix: "/products" })
  // Public routes
  .get("/", async ({ query }) => {
    const result = await ProductService.list(query);
    return { success: true as const, data: result };
  }, { query: ProductModel.listQuery })
  .post("/related", async ({ body }) => {
    const result = await ProductService.getRelatedProducts(body);
    return { success: true as const, data: result };
  }, { body: ProductModel.relatedProductsBody })
  .get("/:slug", async ({ params }) => {
    const product = await ProductService.getBySlug(params.slug);
    if (!product) return status(404, { success: false as const, error: "Product not found" });
    return { success: true as const, data: product };
  })
  // Admin/Editor routes
  .use(authPlugin)
  .post("/", async ({ body }) => {
    const product = await ProductService.create(body);
    return status(201, { success: true as const, data: product });
  }, { isEditor: true, body: ProductModel.createBody })
  .put("/:id", async ({ params, body }) => {
    const product = await ProductService.update(params.id, body);
    if (!product) return status(404, { success: false as const, error: "Product not found" });
    return { success: true as const, data: product };
  }, { isEditor: true, body: ProductModel.updateBody })
  .delete("/:id", async ({ params }) => {
    const result = await ProductService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Product not found" });
    return { success: true as const, message: "Product deleted" };
  }, { isAdmin: true })
  // Variant routes
  .post("/:id/variants", async ({ params, body }) => {
    const variant = await ProductService.createVariant(params.id, body);
    if (!variant) return status(404, { success: false as const, error: "Product not found" });
    return status(201, { success: true as const, data: variant });
  }, { isEditor: true, body: ProductModel.createVariantBody })
  .put("/variants/:variantId", async ({ params, body }) => {
    const variant = await ProductService.updateVariant(params.variantId, body);
    if (!variant) return status(404, { success: false as const, error: "Variant not found" });
    return { success: true as const, data: variant };
  }, { isEditor: true, body: ProductModel.updateVariantBody })
  .delete("/variants/:variantId", async ({ params }) => {
    const result = await ProductService.deleteVariant(params.variantId);
    if (!result) return status(404, { success: false as const, error: "Variant not found" });
    return { success: true as const, message: "Variant deleted" };
  }, { isAdmin: true });
