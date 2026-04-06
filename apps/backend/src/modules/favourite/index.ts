import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { FavouriteService } from "./service";
import { FavouriteModel } from "./model";
import { trackFavouriteAdd, trackFavouriteRemove } from "../analytics/service";

export const favourite = new Elysia({ prefix: "/favourites" })
  .use(authPlugin)
  .get("/", async ({ user }) => {
    const favourites = await FavouriteService.list(user.id);
    return { success: true as const, data: favourites };
  }, { isSignIn: true })
  .post("/", async ({ user, body }) => {
    const result = await FavouriteService.add(user.id, body.productId);
    trackFavouriteAdd(user.id, body.productId);
    return { success: true as const, data: result };
  }, { isSignIn: true, body: FavouriteModel.addBody })
  .delete("/:productId", async ({ user, params }) => {
    const result = await FavouriteService.remove(user.id, params.productId);
    if (!result) return status(404, { success: false as const, error: "Favourite not found" });
    trackFavouriteRemove(user.id, params.productId);
    return { success: true as const, message: "Removed from favourites" };
  }, { isSignIn: true })
  .get("/check/:productId", async ({ user, params }) => {
    const isFavourite = await FavouriteService.check(user.id, params.productId);
    return { success: true as const, data: { isFavourite } };
  }, { isSignIn: true });
