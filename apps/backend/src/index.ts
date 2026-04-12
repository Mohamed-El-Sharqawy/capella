import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { requestLogger } from "./lib/logger";

import { auth } from "./modules/auth";
import { user } from "./modules/user";
import { product } from "./modules/product";
import { collection } from "./modules/collection";
import { order } from "./modules/order";
import { cart } from "./modules/cart";
import { favourite } from "./modules/favourite";
import { wishlist } from "./modules/wishlist";
import { image } from "./modules/image";
import { material } from "./modules/material";
import { stone } from "./modules/stone";
import { clarity } from "./modules/clarity";
import { couponRoutes } from "./modules/coupon";
import { shoppableVideoController } from "./modules/shoppable-video";
import { instagramPostController } from "./modules/instagram-post";
import { reviewController } from "./modules/review";
import { banner } from "./modules/banner";
import { searchController } from "./modules/search";
import { analyticsController } from "./modules/analytics";
import { payment } from "./modules/payment";

const port = process.env.PORT || 3001;

const app = new Elysia()
  .onError(({ code, error, set }) => {
    console.error(`[backend] Error ${set.status || 500} (${code}):`, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  })
  .use(requestLogger)
  .use(
    cors({
      origin: true, // Allow all origins
      credentials: false, // Disable credentials to avoid CORS preflight issues
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "E-Commerce API",
          version: "2.0.0",
          description: "API for the e-commerce platform",
        },
      },
    })
  )
  .get("/", () => ({
    name: "E-Commerce API",
    version: "2.0.0",
    status: "running",
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .group("/api", (app) =>
    app
      .use(auth)
      .use(user)
      .use(product)
      .use(collection)
      .use(order)
      .use(cart)
      .use(favourite)
      .use(wishlist)
      .use(image)
      .use(material)
      .use(stone)
      .use(clarity)
      .use(couponRoutes)
      .use(shoppableVideoController)
      .use(instagramPostController)
      .use(reviewController)
      .use(banner)
      .use(searchController)
      .use(analyticsController)
      .use(payment)
  )
  .listen(port);

console.log(`E-Commerce API is running at http://localhost:${port}`);
console.log(`Swagger docs at http://localhost:${port}/swagger`);

export type App = typeof app;
