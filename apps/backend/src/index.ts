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
import { promoBanner } from "./modules/promo-banner";
import { searchController } from "./modules/search";
import { analyticsController } from "./modules/analytics";
import { payment } from "./modules/payment";
import { contact } from "./modules/contact";
import { dashboardController } from "./modules/dashboard";
import { metaCatalogFeed } from "./modules/meta-catalog";
import { PaymentService } from "./modules/payment/service";

const port = process.env.PORT || 3001;

// CORS origin allowlist. `origin: true` would reflect any origin verbatim —
// unsafe once `credentials: true` ships (CSRF surface). The function returns
// true only for known production / staging / dashboard / localhost origins
// AND any `*.capellauae.com` subdomain (covers PR-preview deployments).
const PR_SUBDOMAIN_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.capellauae\.com$/;
const ALLOWED_ORIGINS = new Set<string>([
  "https://capellauae.com",
  "https://www.capellauae.com",
  "https://test.capellauae.com",
  "https://www.test.capellauae.com",
  "https://dashboard.capellauae.com",
  "https://www.dashboard.capellauae.com",
  "http://localhost:3000",
  "http://localhost:3001",
]);

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin) || PR_SUBDOMAIN_REGEX.test(origin);
}

const app = new Elysia()
  .onError(({ code, error, set }) => {
    console.error(`[backend] Error ${set.status || 500} (${code}):`, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  })
  .use(requestLogger)
  .use(
    cors({
      origin: isAllowedOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-session-id",
        "x-fbp",
        "x-fbc",
        "x-fb-event-id",
      ],
    })
  )
  // Server-side `_fbc` persistence for ITP / ad-blocker resilience (guide §7).
  // When a user lands on the storefront from a Meta ad, the URL carries
  // `?fbclid=...`. The browser Pixel normally writes `_fbc` from that, but
  // ad blockers prevent fbevents.js from running and iOS Safari ITP caps
  // JS-written cookies to 7 days — both lose ad attribution for any later
  // CAPI event. This hook reconstructs `_fbc` server-side as a first-party
  // HTTP cookie (immune to ITP's JS cap), so deferred Purchases retain ad
  // attribution up to the 90-day window. Never overrides a canonical
  // Pixel-written `_fbc` already present on the request.
  .onAfterHandle(({ request, set }) => {
    const referer = request.headers.get("referer");
    if (!referer) return;
    let fbclid: string | null = null;
    try {
      fbclid = new URL(referer).searchParams.get("fbclid");
    } catch {
      return;
    }
    if (!fbclid) return;

    const cookieHeader = request.headers.get("cookie") || "";
    if (/(?:^|; )_fbc=/.test(cookieHeader)) return;

    const value = `fb.1.${Date.now()}.${fbclid}`;
    set.headers = set.headers ?? {};
    if (!set.headers["Set-Cookie"]) {
      set.headers["Set-Cookie"] =
        `_fbc=${value}; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=7776000`;
    }
  })
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
  .use(metaCatalogFeed)
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
      .use(promoBanner)
      .use(searchController)
      .use(analyticsController)
      .use(payment)
      .use(contact)
      .use(dashboardController)
  )
  .listen(port);

PaymentService.registerWebhook();
PaymentService.registerTabbyWebhook();

if (process.env.NODE_ENV === "production" && process.env.META_TEST_EVENT_CODE) {
  console.warn(
    "[CAPI] META_TEST_EVENT_CODE is set in production — sendMetaEvent will ignore it, " +
      "but you should remove the env var to avoid the per-call warning noise."
  );
}

console.log(`E-Commerce API is running at http://localhost:${port}`);
console.log(`Swagger docs at http://localhost:${port}/swagger`);

export type App = typeof app;
