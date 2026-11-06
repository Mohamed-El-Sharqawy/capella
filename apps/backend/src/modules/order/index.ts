import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { OrderService } from "./service";
import { OrderModel } from "./model";
import { extractCapiContext } from "../../lib/meta-capi";
import { OutOfStockError, outOfStockBody } from "../../lib/stock";

/** Run an order-creating call, mapping a stock shortfall to HTTP 409. */
async function withStockGuard<T>(fn: () => Promise<T>) {
  try {
    return { ok: true as const, value: await fn() };
  } catch (error) {
    if (error instanceof OutOfStockError) return { ok: false as const, error };
    throw error;
  }
}

export const order = new Elysia({ prefix: "/orders" })
  .post(
    "/guest",
    async ({ body, request }) => {
      if (!body.guestEmail) {
        return status(400, { success: false as const, error: "Guest email is required" });
      }
      const result = await withStockGuard(() =>
        OrderService.create(body, null, extractCapiContext(request))
      );
      if (!result.ok) return status(409, outOfStockBody(result.error));
      return status(201, { success: true as const, data: result.value });
    },
    { body: OrderModel.createBody }
  )
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
  .post("/", async ({ user, body, request }) => {
    const result = await withStockGuard(() =>
      OrderService.create(body, user.id, extractCapiContext(request))
    );
    if (!result.ok) return status(409, outOfStockBody(result.error));
    return status(201, { success: true as const, data: result.value });
  }, { isSignIn: true, body: OrderModel.createBody })
  .put("/:id/status", async ({ params, body }) => {
    const result = await withStockGuard(() => OrderService.updateStatus(params.id, body.status));
    if (!result.ok) return status(409, outOfStockBody(result.error));
    if (!result.value) return status(404, { success: false as const, error: "Order not found" });
    return { success: true as const, data: result.value };
  }, { isAdmin: true, body: OrderModel.updateStatusBody })
  .put("/:id/payment", async ({ params, body }) => {
    const result = await OrderService.updatePaymentStatus(params.id, body.paid);
    if (!result) return status(404, { success: false as const, error: "Order not found" });
    return { success: true as const, data: result };
  }, { isAdmin: true, body: OrderModel.updatePaymentBody })
  .delete("/:id", async ({ params }) => {
    const result = await OrderService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Order not found" });
    return { success: true as const, message: "Order deleted" };
  }, { isAdmin: true })
  .post("/bulk-delete", async ({ body }) => {
    const count = await OrderService.bulkDelete(body.ids);
    return { success: true as const, data: { deletedCount: count } };
  }, { isAdmin: true, body: OrderModel.bulkDeleteBody });
