import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { OrderService } from "./service";
import { OrderModel } from "./model";

export const order = new Elysia({ prefix: "/orders" })
  // Guest checkout (no auth required)
  .post(
    "/guest",
    async ({ body }) => {
      if (!body.guestEmail) {
        return status(400, { success: false as const, error: "Guest email is required" });
      }
      const result = await OrderService.create(body, null);
      return status(201, { success: true as const, data: result });
    },
    { body: OrderModel.createBody }
  )
  // Authenticated routes
  .use(authPlugin)
  .get("/", async ({ user, query }) => {
    const isAdmin = user.role === "ADMIN";
    const result = await OrderService.list(query, user.id, isAdmin);
    return { success: true as const, data: result };
  }, { isSignIn: true, query: OrderModel.listQuery })
  .get("/:id", async ({ user, params }) => {
    const isAdmin = user.role === "ADMIN";
    const result = await OrderService.getById(params.id, user.id, isAdmin);
    if (!result) return status(404, { success: false as const, error: "Order not found" });
    return { success: true as const, data: result };
  }, { isSignIn: true })
  .post("/", async ({ user, body }) => {
    const result = await OrderService.create(body, user.id);
    return status(201, { success: true as const, data: result });
  }, { isSignIn: true, body: OrderModel.createBody })
  .put("/:id/status", async ({ params, body }) => {
    const result = await OrderService.updateStatus(params.id, body.status);
    if (!result) return status(404, { success: false as const, error: "Order not found" });
    return { success: true as const, data: result };
  }, { isAdmin: true, body: OrderModel.updateStatusBody });
