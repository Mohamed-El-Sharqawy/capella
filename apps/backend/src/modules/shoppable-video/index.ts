import { Elysia, t, status } from "elysia";
import { ShoppableVideoService } from "./service";
import { ShoppableVideoModel } from "./model";
import { authPlugin } from "../../plugins/auth";
import { CloudinaryService } from "../../lib/cloudinary";

export const shoppableVideoController = new Elysia({ prefix: "/shoppable-videos" })
  // Public: list active videos
  .get("/", async () => {
    const videos = await ShoppableVideoService.list(true);
    return { ok: true, data: videos };
  })
  // Admin routes
  .use(authPlugin)
  // Admin: list all videos
  .get("/admin", async () => {
    const videos = await ShoppableVideoService.list(false);
    return { ok: true, data: videos };
  }, { isAdmin: true })
  // Admin: get single video
  .get("/admin/:id", async ({ params }) => {
    const video = await ShoppableVideoService.getById(params.id);
    if (!video) return status(404, { ok: false, error: "Video not found" });
    return { ok: true, data: video };
  }, { isAdmin: true, params: ShoppableVideoModel.params })
  // Admin: create video with file upload
  .post("/", async ({ body }) => {
    const videoFile = body.video;
    const thumbnailFile = body.thumbnail;
    
    if (!videoFile || !thumbnailFile) {
      return status(400, { ok: false, error: "Video and thumbnail are required" });
    }

    // Upload video (as video resource) and thumbnail (as image)
    const videoResult = await CloudinaryService.uploadVideo(videoFile, "shoppable-videos");
    const thumbnailResult = await CloudinaryService.upload(thumbnailFile, "shoppable-videos/thumbnails");

    // FormData sends everything as strings, convert them
    const position = body.position !== undefined ? Number(body.position) : undefined;
    const isActive = body.isActive !== undefined ? body.isActive === "true" || body.isActive === true : undefined;

    const video = await ShoppableVideoService.create({
      productId: body.productId,
      videoUrl: videoResult.url,
      videoPublicId: videoResult.publicId,
      thumbnailUrl: thumbnailResult.url,
      thumbnailPublicId: thumbnailResult.publicId,
      position,
      isActive,
    });

    return status(201, { ok: true, data: video });
  }, {
    isAdmin: true,
    body: t.Object({
      video: t.File(),
      thumbnail: t.File(),
      productId: t.String(),
      position: t.Optional(t.Union([t.Number(), t.String()])),
      isActive: t.Optional(t.Union([t.Boolean(), t.String()])),
    }),
  })
  // Admin: update video
  .patch("/:id", async ({ params, body }) => {
    const video = await ShoppableVideoService.update(params.id, body);
    if (!video) return status(404, { ok: false, error: "Video not found" });
    return { ok: true, data: video };
  }, {
    isAdmin: true,
    params: ShoppableVideoModel.params,
    body: ShoppableVideoModel.update,
  })
  // Admin: delete video
  .delete("/:id", async ({ params }) => {
    const result = await ShoppableVideoService.delete(params.id);
    if (!result) return status(404, { ok: false, error: "Video not found" });
    return { ok: true, message: "Video deleted" };
  }, { isAdmin: true, params: ShoppableVideoModel.params })
  // Admin: reorder videos
  .post("/reorder", async ({ body }) => {
    await ShoppableVideoService.reorder(body.ids);
    return { ok: true, message: "Videos reordered" };
  }, {
    isAdmin: true,
    body: t.Object({ ids: t.Array(t.String()) }),
  });
