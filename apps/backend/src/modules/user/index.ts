import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { UserService } from "./service";
import { UserModel } from "./model";

export const user = new Elysia({ prefix: "/users" })
  .use(authPlugin)
  .get("/me", async ({ user }) => {
    const profile = await UserService.getProfile(user.id);
    if (!profile) return status(404, { success: false as const, error: "User not found" });
    return { success: true as const, data: profile };
  }, { isSignIn: true })
  .put("/me", async ({ user, body }) => {
    const updated = await UserService.updateProfile(user.id, body);
    return { success: true as const, data: updated };
  }, { isSignIn: true, body: UserModel.updateProfile })
  .patch("/me", async ({ user, body }) => {
    const updated = await UserService.updateProfile(user.id, body);
    return { success: true as const, data: updated };
  }, { isSignIn: true, body: UserModel.updateProfile })
  // Addresses
  .get("/me/addresses", async ({ user }) => {
    const addresses = await UserService.getAddresses(user.id);
    return { success: true as const, data: addresses };
  }, { isSignIn: true })
  .post("/me/addresses", async ({ user, body }) => {
    const address = await UserService.createAddress(user.id, body);
    return { success: true as const, data: address };
  }, { isSignIn: true, body: UserModel.createAddress })
  .put("/me/addresses/:id", async ({ user, params, body }) => {
    const address = await UserService.updateAddress(user.id, params.id, body);
    if (!address) return status(404, { success: false as const, error: "Address not found" });
    return { success: true as const, data: address };
  }, { isSignIn: true, body: UserModel.updateAddress })
  .delete("/me/addresses/:id", async ({ user, params }) => {
    const result = await UserService.deleteAddress(user.id, params.id);
    if (!result) return status(404, { success: false as const, error: "Address not found" });
    return { success: true as const, message: "Address deleted" };
  }, { isSignIn: true })
  // Admin: list users
  .get("/", async ({ query }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const result = await UserService.listUsers(page, limit);
    return { success: true as const, data: result };
  }, { isAdmin: true, query: UserModel.paginationQuery })
  // Admin: get user details with orders and events
  .get("/:id", async ({ params }) => {
    const user = await UserService.getUserDetails(params.id);
    if (!user) return status(404, { success: false as const, error: "User not found" });
    return { success: true as const, data: user };
  }, { isAdmin: true });
