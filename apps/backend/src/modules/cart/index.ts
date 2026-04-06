import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { CartService } from "./service";
import { CartModel } from "./model";
import { trackCartAdd, trackCartRemove, trackCartUpdate, trackCartClear } from "../analytics/service";

export const cart = new Elysia({ prefix: "/cart" })
  .use(authPlugin)
  .get("/", async ({ user }) => {
    const result = await CartService.getOrCreateCart(user.id);
    return { success: true as const, data: result };
  }, { isSignIn: true })
  .post("/items", async ({ user, body }) => {
    const result = await CartService.addItem(user.id, body);
    trackCartAdd(user.id, { variantId: body.variantId, quantity: body.quantity });
    return { success: true as const, data: result };
  }, { isSignIn: true, body: CartModel.addItemBody })
  .put("/items/:itemId", async ({ user, params, body }) => {
    const result = await CartService.updateItem(user.id, params.itemId, body);
    if (!result) return status(404, { success: false as const, error: "Cart item not found" });
    trackCartUpdate(user.id, { quantity: body.quantity });
    return { success: true as const, data: result };
  }, { isSignIn: true, body: CartModel.updateItemBody })
  .delete("/items/:itemId", async ({ user, params }) => {
    const result = await CartService.removeItem(user.id, params.itemId);
    if (!result) return status(404, { success: false as const, error: "Cart item not found" });
    trackCartRemove(user.id, { itemId: params.itemId });
    return { success: true as const, data: result };
  }, { isSignIn: true })
  .delete("/", async ({ user }) => {
    const result = await CartService.clearCart(user.id);
    trackCartClear(user.id);
    return { success: true as const, data: result };
  }, { isSignIn: true });
