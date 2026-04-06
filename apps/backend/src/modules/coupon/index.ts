import { Elysia, status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { CouponService } from "./service";
import { CouponModel } from "./model";

export const couponRoutes = new Elysia({ prefix: "/coupons" })
  .use(authPlugin)
  .get("/", async () => {
    const coupons = await CouponService.list();
    return { success: true as const, data: coupons };
  }, { isEditor: true })

  .get("/:id", async ({ params }) => {
    const coupon = await CouponService.getById(params.id);
    if (!coupon) return status(404, { success: false as const, error: "Coupon not found" });
    return { success: true as const, data: coupon };
  }, { isEditor: true })

  .post("/", async ({ body }) => {
    try {
      const coupon = await CouponService.create(body);
      return status(201, { success: true as const, data: coupon });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        return status(400, { success: false as const, error: "Coupon code already exists" });
      }
      throw err;
    }
  }, { isEditor: true, body: CouponModel.createBody })

  .put("/:id", async ({ params, body }) => {
    try {
      const coupon = await CouponService.update(params.id, body);
      if (!coupon) return status(404, { success: false as const, error: "Coupon not found" });
      return { success: true as const, data: coupon };
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        return status(400, { success: false as const, error: "Coupon code already exists" });
      }
      throw err;
    }
  }, { isEditor: true, body: CouponModel.updateBody })

  .delete("/:id", async ({ params }) => {
    const result = await CouponService.delete(params.id);
    if (!result) return status(404, { success: false as const, error: "Coupon not found" });
    return { success: true as const, message: "Coupon deleted" };
  }, { isAdmin: true })

  .post("/validate", async ({ body }) => {
    const result = await CouponService.validate(body.code, body.orderTotal, body.userId);
    if (!result.valid) {
      return status(400, { success: false as const, error: result.error });
    }
    return {
      success: true as const,
      data: {
        coupon: result.coupon,
        discountAmount: result.discountAmount,
        finalTotal: result.finalTotal,
      },
    };
  }, { body: CouponModel.validateBody });
