import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { WishlistService } from "./service";
import { WishlistModel } from "./model";
import { trackWishlistAdd, trackWishlistRemove } from "../analytics/service";

export const wishlist = new Elysia({ prefix: "/wishlist" })
  .use(authPlugin)
  .get("/", async ({ user }) => {
    const items = await WishlistService.list(user.id);
    return { success: true as const, data: items };
  }, { isSignIn: true })
  .post("/", async ({ user, body }) => {
    const result = await WishlistService.add(user.id, body);
    trackWishlistAdd(user.id, body.productId, body.note);
    return { success: true as const, data: result };
  }, { isSignIn: true, body: WishlistModel.addBody })
  .put("/:productId", async ({ user, params, body }) => {
    const result = await WishlistService.update(user.id, params.productId, body);
    if (!result) return status(404, { success: false as const, error: "Wishlist item not found" });
    return { success: true as const, data: result };
  }, { isSignIn: true, body: WishlistModel.updateBody })
  .delete("/:productId", async ({ user, params }) => {
    const result = await WishlistService.remove(user.id, params.productId);
    if (!result) return status(404, { success: false as const, error: "Wishlist item not found" });
    trackWishlistRemove(user.id, params.productId);
    return { success: true as const, message: "Removed from wishlist" };
  }, { isSignIn: true });
