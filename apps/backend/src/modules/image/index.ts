import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { ImageService } from "./service";
import { ImageModel } from "./model";

export const image = new Elysia({ prefix: "/images" })
  .use(authPlugin)

  // ==========================================
  // Product Images (upload to product level)
  // ==========================================
  .post("/products/:productId", async ({ params, body }) => {
    const images = await ImageService.uploadProductImages(
      params.productId,
      body.files as File[],
      body.altEn,
      body.altAr
    );
    if (!images) return status(404, { success: false as const, error: "Product not found" });
    return status(201, { success: true as const, data: images });
  }, { isEditor: true, body: ImageModel.uploadVariantImages })

  .get("/products/:productId", async ({ params }) => {
    const images = await ImageService.getProductImages(params.productId);
    return { success: true as const, data: images };
  }, { isEditor: true })

  .delete("/products/image/:imageId", async ({ params }) => {
    const result = await ImageService.deleteProductImage(params.imageId);
    if (!result) return status(404, { success: false as const, error: "Image not found" });
    return { success: true as const, message: "Image deleted" };
  }, { isEditor: true })

  .patch("/products/image/:imageId", async ({ params, body }) => {
    const image = await ImageService.updateProductImage(params.imageId, body.altEn, body.altAr);
    return { success: true as const, data: image };
  }, { isEditor: true, body: ImageModel.updateImageAlt })

  // ==========================================
  // Variant Image Links (link/unlink images to variants)
  // ==========================================
  .post("/link", async ({ body }) => {
    const result = await ImageService.linkImageToVariant(body.imageId, body.variantId, body.position);
    if (!result) return status(404, { success: false as const, error: "Image or variant not found" });
    return status(201, { success: true as const, data: result });
  }, { isEditor: true, body: ImageModel.linkImage })

  .post("/link-multiple", async ({ body }) => {
    const result = await ImageService.linkImageToVariants(body.imageId, body.variantIds);
    if (!result) return status(404, { success: false as const, error: "Image not found" });
    return status(201, { success: true as const, data: result });
  }, { isEditor: true, body: ImageModel.linkImageMultiple })

  .delete("/link/:imageId/:variantId", async ({ params }) => {
    const result = await ImageService.unlinkImageFromVariant(params.imageId, params.variantId);
    if (!result) return status(404, { success: false as const, error: "Link not found" });
    return { success: true as const, message: "Image unlinked from variant" };
  }, { isEditor: true })

  .patch("/link/:imageId/:variantId/position", async ({ params, body }) => {
    const result = await ImageService.updateImagePosition(params.imageId, params.variantId, body.position);
    return { success: true as const, data: result };
  }, { isEditor: true, body: ImageModel.updatePosition })

  .post("/variants/:variantId/reorder", async ({ params, body }) => {
    const result = await ImageService.reorderVariantImages(params.variantId, body.imageIds);
    return { success: true as const, data: result };
  }, { isEditor: true, body: ImageModel.reorderImages })

  .get("/variants/:variantId", async ({ params }) => {
    const images = await ImageService.getVariantImages(params.variantId);
    return { success: true as const, data: images };
  }, { isEditor: true })

  // ==========================================
  // Legacy: Upload and link to variant in one step
  // ==========================================
  .post("/variants/:variantId/upload", async ({ params, body }) => {
    const images = await ImageService.addVariantImages(
      params.variantId,
      body.files as File[],
      body.altEn,
      body.altAr
    );
    if (!images) return status(404, { success: false as const, error: "Variant not found" });
    return status(201, { success: true as const, data: images });
  }, { isEditor: true, body: ImageModel.uploadVariantImages })

  .delete("/variants/link/:linkId", async ({ params }) => {
    const result = await ImageService.deleteVariantImage(params.linkId);
    if (!result) return status(404, { success: false as const, error: "Image link not found" });
    return { success: true as const, message: "Image removed from variant" };
  }, { isEditor: true })
  // Size guide image
  .post("/size-guide/:productId", async ({ params, body }) => {
    const result = await ImageService.setSizeGuide(params.productId, body.file as File);
    if (!result) return status(404, { success: false as const, error: "Product not found" });
    return status(201, { success: true as const, data: result });
  }, { isEditor: true, body: ImageModel.uploadSizeGuide })
  .delete("/size-guide/:productId", async ({ params }) => {
    const result = await ImageService.deleteSizeGuide(params.productId);
    if (!result) return status(404, { success: false as const, error: "Size guide not found" });
    return { success: true as const, message: "Size guide deleted" };
  }, { isEditor: true })
  // Collection image
  .post("/collections/:collectionId", async ({ params, body }) => {
    const img = await ImageService.setCollectionImage(
      params.collectionId,
      body.file as File,
      body.altEn,
      body.altAr
    );
    if (!img) return status(404, { success: false as const, error: "Collection not found" });
    return status(201, { success: true as const, data: img });
  }, { isEditor: true, body: ImageModel.uploadCollectionImage })
  .delete("/collections/:collectionId", async ({ params }) => {
    const result = await ImageService.deleteCollectionImage(params.collectionId);
    if (!result) return status(404, { success: false as const, error: "Image not found" });
    return { success: true as const, message: "Image deleted" };
  }, { isEditor: true })

  // Generic upload (for banners, etc.)
  .post("/upload", async ({ body }) => {
    const result = await ImageService.uploadGeneric(body.file as File, body.folder);
    return status(201, { success: true as const, data: result });
  }, { isEditor: true, body: ImageModel.uploadGeneric });
