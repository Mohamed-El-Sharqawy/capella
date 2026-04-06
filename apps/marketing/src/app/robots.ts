import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nznstudio.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Auth pages - no need to index
          "/*/auth/",
          "/*/auth/*",
          
          // User account pages - private
          "/*/account/",
          "/*/account/*",
          
          // Cart & Checkout - transactional, not indexable
          "/*/cart/",
          "/*/cart/*",
          "/*/checkout/",
          "/*/checkout/*",
          
          // API routes
          "/api/",
          "/api/*",
          
          // Next.js internals
          "/_next/",
          "/_next/*",
          
          // Static files that shouldn't be indexed
          "/*.json$",
          "/*.xml$",
        ],
      },
      {
        // Block AI crawlers that don't respect content
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
