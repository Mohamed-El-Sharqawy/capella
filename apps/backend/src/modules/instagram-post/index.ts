import { Elysia, t, status } from "elysia";
import { InstagramPostService } from "./service";
import { InstagramPostModel } from "./model";
import { authPlugin } from "../../plugins/auth";
import { CloudinaryService } from "../../lib/cloudinary";

export const instagramPostController = new Elysia({ prefix: "/instagram-posts" })
  // Public: list active posts
  .get("/", async () => {
    const posts = await InstagramPostService.list(true);
    return { ok: true, data: posts };
  })
  // Admin routes
  .use(authPlugin)
  // Admin: list all posts
  .get("/admin", async () => {
    const posts = await InstagramPostService.list(false);
    return { ok: true, data: posts };
  }, { isAdmin: true })
  // Admin: get single post
  .get("/admin/:id", async ({ params }) => {
    const post = await InstagramPostService.getById(params.id);
    if (!post) return status(404, { ok: false, error: "Post not found" });
    return { ok: true, data: post };
  }, { isAdmin: true, params: InstagramPostModel.params })
  // Admin: create post with file upload
  .post("/", async ({ body }) => {
    const imageFile = body.image;
    
    if (!imageFile) {
      return status(400, { ok: false, error: "Image is required" });
    }

    // Upload image
    const imageResult = await CloudinaryService.upload(imageFile, "instagram-posts");

    // FormData sends everything as strings, convert them
    const position = body.position !== undefined ? Number(body.position) : undefined;
    const isActive = body.isActive !== undefined ? body.isActive === "true" || body.isActive === true : undefined;

    const post = await InstagramPostService.create({
      imageUrl: imageResult.url,
      publicId: imageResult.publicId,
      linkUrl: body.linkUrl,
      altEn: body.altEn,
      altAr: body.altAr,
      position,
      isActive,
    });

    return status(201, { ok: true, data: post });
  }, {
    isAdmin: true,
    body: t.Object({
      image: t.File(),
      linkUrl: t.Optional(t.String()),
      altEn: t.Optional(t.String()),
      altAr: t.Optional(t.String()),
      position: t.Optional(t.Union([t.Number(), t.String()])),
      isActive: t.Optional(t.Union([t.Boolean(), t.String()])),
    }),
  })
  // Admin: update post
  .patch("/:id", async ({ params, body }) => {
    const post = await InstagramPostService.update(params.id, body);
    if (!post) return status(404, { ok: false, error: "Post not found" });
    return { ok: true, data: post };
  }, {
    isAdmin: true,
    params: InstagramPostModel.params,
    body: InstagramPostModel.update,
  })
  // Admin: delete post
  .delete("/:id", async ({ params }) => {
    const result = await InstagramPostService.delete(params.id);
    if (!result) return status(404, { ok: false, error: "Post not found" });
    return { ok: true, message: "Post deleted" };
  }, { isAdmin: true, params: InstagramPostModel.params })
  // Admin: reorder posts
  .post("/reorder", async ({ body }) => {
    await InstagramPostService.reorder(body.ids);
    return { ok: true, message: "Posts reordered" };
  }, {
    isAdmin: true,
    body: t.Object({ ids: t.Array(t.String()) }),
  });
