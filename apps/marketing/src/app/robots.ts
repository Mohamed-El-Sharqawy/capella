import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/metadata";

/**
 * Only private / transactional pages are blocked. Everything a shopper (or an
 * AI assistant answering a shopper) needs stays crawlable: products,
 * collections, policies, llms.txt and the sitemaps.
 *
 * Do NOT block /_next/ (Google needs JS/CSS to render pages) or *.xml (that
 * would block our own sitemaps).
 */
const PRIVATE_PATHS = [
  "/api/",
  "/*/auth/",
  "/*/account/",
  "/*/cart",
  "/*/checkout",
];

/**
 * AI crawlers explicitly welcomed so the brand and products can appear in
 * AI answers (ChatGPT, Claude, Perplexity, Gemini, Apple Intelligence, Copilot).
 * Listed separately so any one can be switched to `disallow: "/"` later.
 */
const AI_CRAWLERS = [
  // OpenAI: search results, user-triggered browsing, model training
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  // Anthropic
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google Gemini / AI Overviews grounding, Apple Intelligence
  "Google-Extended",
  "Applebot-Extended",
  // Others
  "CCBot",
  "Meta-ExternalAgent",
  "Amazonbot",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
