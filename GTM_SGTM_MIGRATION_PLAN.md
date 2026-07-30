# GTM + Server-Side GTM (sGTM) — Migration Plan

> Scope: add **client-side Google Tag Manager (GTM)**, **self-hosted server-side GTM (sGTM)** on the existing Hostinger VPS (managed by Coolify), wire up **GA4** as a new channel, and route **Meta through sGTM** — all while preserving the existing dual-channel Meta (Pixel + Conversions API) deduplication contract documented in `META_EVENTS_ARCHITECTURE.md`.
>
> This is a research/planning artifact. No application code is modified by this document; each phase lists the exact files/lines to change when implementation begins.

---

## Executive Summary

Today the storefront (`apps/marketing`, Next.js 16 App Router) loads the Meta Pixel directly via `next/script` (`apps/marketing/src/components/analytics/facebook-pixel.tsx:7-46`) and the backend (`apps/backend`, Elysia/Bun) posts Conversions API events to the Meta Graph API from `apps/backend/src/lib/meta-capi.ts:1-360`. Deduplication works through a shared `event_id` plus `_fbp`/`_fbc` forwarding (`apps/marketing/src/lib/capi-headers.ts`, `apps/marketing/src/lib/meta-cookies.ts`). This is correct but **single-vendor**: there is no GA4, no consent layer, no ad-blocker resilience, and PII hashing/transport is split across two codebases.

This plan migrates tracking to a **GTM-managed, sGTM-mediated** architecture: the browser pushes a `dataLayer`; client-side GTM emits the browser hits; a self-hosted sGTM container on `metrics.capellauae.com` (first-party subdomain, same registrable domain as `capellauae.com`) receives the hits, hashes PII centrally, and forwards to **Meta CAPI and GA4 Measurement Protocol**. The migration uses a **parallel-run then cutover** strategy with a feature-flag kill-switch, so at no point does Meta receive double-counted events.

Currency remains **AED** everywhere. Domain is `capellauae.com`.

---

## Architecture Diagram

```
                                   BROWSER (capellauae.com)
  +--------------------------------------------------------------------------+
  |  Next.js 16 App Router (apps/marketing)                                   |
  |                                                                           |
  |   dataLayer.push({ event, ecommerce, event_id, user_data })               |
  |        |                                                                  |
  |        v                                                                  |
   |   +-------------------+        +------------------------+                 |
   |   | GTM container     |        | Consent Mode v2        |                 |
   |   | (gtm.js, Web)     |<-------| gtag('consent',...)    |                 |
   |   | - Meta Pixel tag  |        | default: ALL GRANTED   |                 |
   |   | - GA4 config tag  |        | (no banner, UAE-only)  |                 |
   |   | - conversion link |        +------------------------+                 |
  |   +--------+----------+                                                   |
  |            |                                                             |
  |   two transports from the browser:                                       |
  |   (1) Meta Pixel  --> connect.facebook.net  (browser signals: fbp/fbc,AAM)|
  |   (2) GA4 client  --> https://metrics.capellauae.com/g/collect            |
  |                       (first-party sGTM endpoint, beats ad blockers)      |
  +---------------------|----------------------------------------------------+
                        |
            +-----------+--------------+
            |  sGTM container          |   metrics.capellauae.com
            |  gtm-cloud-image:4.4.0 |   (first-party subdomain of
            |  (Coolify / Traefik)     |    capellauae.com -> same-site
            |                          |    cookies, _fbp/_fbc readable)
            |  Clients:                |
            |   - GA4 (Web) client     |
            |  Server tags:            |
            |   - Meta Conversions API |--> graph.facebook.com  (CAPI)
|   - GA4 MP               |--> www.google-analytics.com
|  Hashing: SHA-256 here   |    (em/ph/fn/ln/ct/... + external_id)
            +--------------------------+
                        ^
                        | (optional, Phase 7) server-originated events
                        |
  +---------------------|----------------------------------------------------+
  |  Backend (apps/backend, Elysia/Bun, port 3001)                            |
  |                                                                           |
  |   Ziina webhook -> PaymentService.handlePaymentCompleted()                |
  |     -> sendMetaEvent({ eventName:'Purchase', eventId:`order_${id}` })     |
  |                                                                           |
  |   Two options (see Phase 4 decision table):                               |
  |   (A) Keep calling Graph API directly (apps/backend/src/lib/meta-capi.ts) |
  |       -- recommended default; already correct, retry/backoff, hashing.    |
  |   (B) POST to sGTM first-party endpoint; sGTM fires Meta CAPI tag.        |
  |       -- centralizes all CAPI in sGTM (single hashing source).            |
  |                                                                           |
  |   /api/analytics/* still receives internal track bodies (fbp/fbc/eventId) |
  |   and persists them for async webhook replay (Order.fbp / Order.fbc).     |
  +--------------------------------------------------------------------------+

  DEDUP CONTRACT (unchanged): browser event_id === server event_id === sGTM event_id
  Meta collapses (browser Pixel hit, sGTM CAPI event) into ONE event when
  (event_name, event_id) match and fbp agrees.
```

**Key point:** Meta cannot be moved 100% server-side without losing browser signals (`_fbp`/`_fbc` generation, Advanced Matching, retargeting). The recommended hybrid keeps the Meta browser Pixel (now loaded by GTM, not hardcoded) and moves the **CAPI** server call into sGTM. GA4 goes **fully** browser->sGTM->vendor, which is where the ad-blocker evasion benefit is realized.

---

## Phase 0 — Prerequisites

### 0.1 Accounts to create

| Account / Resource | Where | Purpose |
|---|---|---|
| GTM **Web** container | tagmanager.google.com | Client-side container for `apps/marketing` |
| GTM **Server** container | tagmanager.google.com (same workspace, new container, type Server) | Config source for self-hosted sGTM |
| GA4 property | analytics.google.com | Web stream + Measurement ID `G-XXXXXXXX` + Measurement Protocol API secret |
| Meta assets (already exist) | business.facebook.com | Pixel ID + CAPI access token — reused, no new account |

### 0.2 DNS / Coolify prep

- Decide sGTM hostname. See **First-party domain strategy** below. Recommended: `metrics.capellauae.com` (A record -> VPS IP, same as `api.capellauae.com`).
- Ensure the VPS has spare RAM: sGTM needs ~512MB-1GB headroom. Check with `docker stats` on the Hostinger VPS.
- Back up the Postgres database (Coolify -> Postgres resource -> Backup) and snapshot the running marketing + backend containers before touching tracking.

### 0.3 Codebase backups / baselines

- Tag current `main`: `git tag pre-gtm-migration` so rollback is a redeploy of this tag.
- Capture **baseline Event Match Quality** from Meta Events Manager for Purchase, AddToCart, InitiateCheckout, Lead, CompleteRegistration (see Phase 6). Record the numbers; you need a before/after delta.

### 0.4 First-party domain strategy (EMQ impact)

| Option | Setup | Cookie status | Ad-blocker evasion | EMQ impact | Recommendation |
|---|---|---|---|---|---|
| **A. Dedicated subdomain** `metrics.capellauae.com` | One Coolify service, one Traefik host rule, its own Let's Encrypt cert | **Same-site** (shares registrable domain `capellauae.com`) -> `_fbp`/`_fbc` set on `.capellauae.com` are readable | Good (not on common blocklists) | Equivalent to B | **Primary (Coolify-native, simplest)** |
| **B. Path on root** `capellauae.com/g/*` | Requires a second Traefik router (`Host(capellauae.com) && PathPrefix(/g)`) pointing at the sGTM container alongside the marketing router | **Same-site, same-origin** | Marginally better (transport URL identical to site origin) | Equivalent | Optional advanced optimization |

**EMQ conclusion:** Both A and B are first-party to `capellauae.com` (same registrable domain / eTLD+1), so Meta/Google browser-identifier cookies (`_fbp`, `_fbc`, `_ga`) link correctly under either. The Event Match Quality score is **effectively identical**. Option B only helps against the narrow set of ad blockers that key off subdomain hostnames. Because Coolify's UI natively maps one domain per service and issues the cert automatically, **Option A is recommended**; revisit B only if ad-blocker drop-off on GA4 is observed post-launch.

> Note: the task brief mentioned `metrics.capellauze.com` (typo). The correct domain used throughout this plan is `metrics.capellauae.com`.

---

## Phase 1 — Provision & Secure sGTM on Coolify

sGTM runs the official Google image `gcr.io/cloud-tagging-10302018/gtm-cloud-image` (NOT `gcr.io/google-tag-server` — that is not a public image). Verified 2026-07-30: current stable tag `4.4.0` (distroless Node 24). It listens on **port 8080**; the health endpoint is **`/healthy`** (returns `ok`), NOT `/healthz`. The official image reads ONLY `CONTAINER_CONFIG` (+ `PORT`, `PREVIEW_SERVER_URL`) — GA4/Meta credentials are entered in the server tags in the GTM UI and compiled into `CONTAINER_CONFIG` on publish (NOT container env vars).

### 1.1 Docker Compose for Coolify

The verified, deployment-ready file is **`apps/sgtm/docker-compose.sgtm.yaml`** — refer to it directly (it supersedes the snippet below, kept for context). Add via Coolify: New Resource → Docker Compose → point at that file. Production service only; an optional commented preview service is included. Illustrative snippet:

```yaml
# docker-compose.sgtm.yaml
# Add via Coolify: New Resource -> Docker Compose -> point at this file.
version: "3.8"

services:
  sgtm:
    image: gcr.io/cloud-tagging-10302018/gtm-cloud-image:4.4.0   # VERIFIED 2026-07-30; pin + bump deliberately
    container_name: capella-sgtm
    restart: unless-stopped
    expose:
      - "8080"
    environment:
      # VERIFIED: official image reads ONLY CONTAINER_CONFIG (+ PORT, PREVIEW_SERVER_URL).
      # GA4/Meta credentials go in the GTM server tags (compiled into CONTAINER_CONFIG on publish),
      # NOT as container env vars. See apps/sgtm/.env + GTM_DASHBOARD_PLAYBOOK.md.
      - CONTAINER_CONFIG=${SGTM_CONTAINER_CONFIG}
      - PORT=8080
    volumes:
      # sGTM is mostly stateless; /tmp is scratch for preview/diagnostics.
      - sgtm-tmp:/tmp
    labels:
      - "traefik.enable=true"
      # Production router (HTTPS only)
      - "traefik.http.routers.sgtm.rule=Host(`metrics.capellauae.com`)"
      - "traefik.http.routers.sgtm.entrypoints=websecure"
      - "traefik.http.routers.sgtm.tls.certresolver=letsencrypt"
      - "traefik.http.routers.sgtm.service=sgtm-svc"
      - "traefik.http.services.sgtm-svc.loadbalancer.server.port=8080"
      # Redirect HTTP -> HTTPS
      - "traefik.http.routers.sgtm-http.rule=Host(`metrics.capellauae.com`)"
      - "traefik.http.routers.sgtm-http.entrypoints=web"
      - "traefik.http.routers.sgtm-http.middlewares=https-redirect"
      - "traefik.docker.network=coolify"
    networks:
      - coolify-network
    healthcheck:
      # VERIFIED: endpoint is /healthy (returns "ok"), NOT /healthz. Image is
      # distroless (node only at /nodejs/bin/node; no shell/curl/wget) -> exec form.
      test: ["CMD", "/nodejs/bin/node", "-e", "fetch('http://localhost:8080/healthy').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "1.0"
        reservations:
          memory: 256M

volumes:
  sgtm-tmp:

networks:
  coolify-network:
    external: true
    name: ${COOLIFY_DB_NETWORK:-coolify}
```

> The `traefik.http.middlewares.https-redirect` middleware must already exist in the Coolify Traefik config (it does by default). If your Coolify uses Caddy instead of Traefik, replace the labels with Caddy labels (see `DEPLOYMENT.md` networking notes). The labels above mirror the style already used in `docker-compose.marketing.yaml:24-31`.

### 1.2 Coolify provisioning steps

1. Coolify Dashboard -> **Resources** -> **New** -> **Docker Compose**.
2. Connect the repository; set **Docker Compose Location** to `docker-compose.sgtm.yaml`.
3. Set the **Domain** field to `https://metrics.capellauae.com` (Coolify will configure Traefik + issue the Let's Encrypt cert automatically).
4. In **Environment Variables** (Coolify UI), add every `${VAR}` from the compose file (see the Environment Variables table at the end of this doc). Mark `SGTM_CONTAINER_CONFIG`, `META_CAPI_ACCESS_TOKEN`, `GA4_MP_API_SECRET` as secrets.
5. Confirm the service attaches to the same external network as backend/marketing (`coolify-network`, name `${COOLIFY_DB_NETWORK:-coolify}`) so it can be addressed internally as `sgtm:8080` if the backend ever proxies through it (Phase 4 option B).
6. Enable **Auto Deploy** off initially (manual deploys during parallel run); flip on after cutover.
7. Click **Deploy**. Verify `https://metrics.capellauae.com/healthy` returns `ok` (200). Check `docker logs capella-sgtm`.

### 1.3 Seeding the container config (`server_container_config`)

The runtime config that tells sGTM which container workspace to run is delivered via the `CONTAINER_CONFIG` env var (NOT the same as a container export/import):

1. In GTM, open the **Server** container -> **Admin** -> **Container** -> **Install** -> choose **"Manually provision server"**.
2. Copy the **Container Config** JSON string (it contains the public key + signing key + the config blob).
3. Paste the full JSON as the value of `SGTM_CONTAINER_CONFIG` in Coolify env.
4. Redeploy the sGTM service. On boot it logs `Container config loaded`.

**Export/import (workspace, separate from runtime config):** to move the *workspace* (clients, tags, triggers, variables) between containers or to keep it in git, use **Admin** -> **Export Container** -> download the JSON -> commit to a `sgtm/` folder in the repo. To restore: **Admin** -> **Import Container** -> select the JSON -> merge or overwrite. Recommend committing `sgtm/workspace-export.json` to the repo as the source of truth and re-exporting after every change.

### 1.4 Admin / preview lockdown (security)

- sGTM allocates the preview port dynamically. **Do not** map it to a host port. Traefik must only route `Host(metrics.capellauae.com)` to `8080`.
- To use Preview mode safely, front the preview with **Cloudflare Access** (zero-trust) OR an IP allowlist on the VPS firewall for the preview port range. Typical practice: open the preview port only to your office IP for the duration of a debug session, then close it.
- Never put `CONTAINER_CONFIG`, `META_CAPI_ACCESS_TOKEN`, or `GA4_MP_API_SECRET` in the container image; always via Coolify env (secrets).

### 1.5 sGTM-scoped Meta token

Create a **dedicated** Meta CAPI access token for sGTM (`META_CAPI_ACCESS_TOKEN`) rather than reusing the backend's `META_ACCESS_TOKEN`. Rationale: independent rotation, independent permission scoping, and cleaner audit logs (you can tell Events Manager which path fired an event). Keep `META_ACCESS_TOKEN` on the backend for the Ziina-webhook path during parallel run.

---

## Phase 2 — Client-Side GTM in Next.js 16 (App Router)

### 2.1 Script injection strategy

The existing pixel is injected in `<head>` at `apps/marketing/src/app/[locale]/layout.tsx:117` via the `FacebookPixel` component (`apps/marketing/src/components/analytics/facebook-pixel.tsx`). Replace this with a single `<GtmScript>` component that:

- Initializes `window.dataLayer = window.dataLayer || []` **synchronously before** the GTM snippet (a push before GTM loads is queued and replayed; a push to an undefined dataLayer is lost).
- Loads `gtm.js` with `next/script` `strategy="afterInteractive"` (the same strategy used today; `lazyOnload` is too late — landing attribution breaks).
- Sets **Consent Mode v2 defaults to ALL GRANTED** synchronously (no banner — UAE-only; see 2.4). Google modelling still benefits from the explicit grant signal.
- Is rendered **once** in the root layout, not in nested layouts (avoids duplicate loads).

During **parallel run**, both `<FacebookPixel />` and `<GtmScript />` render, gated by separate env flags so you can kill either side independently.

Proposed component (to be implemented; do NOT add now):

```tsx
// apps/marketing/src/components/analytics/gtm-script.tsx  (future)
"use client";
import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const SGTM_URL = process.env.NEXT_PUBLIC_SGTM_URL; // https://metrics.capellauae.com

export function GtmScript() {
  if (!GTM_ID) return null;
  return (
    <Script id="gtm-base" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent','default',{
        'ad_storage':'granted','ad_user_data':'granted','ad_personalization':'granted',
        'analytics_storage':'granted','functionality_storage':'granted',
        'security_storage':'granted','wait_for_update':500
      });
      gtag('set','server_url','${SGTM_URL}');
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GTM_ID}');
    `}}/>
  );
}
```

Add `<GtmScript />` next to `<FacebookPixel />` in `app/[locale]\layout.tsx`. Add the matching `<noscript>` iframe in `<body>`.

### 2.2 `dataLayer` typing

Add a global declaration so all pushes are type-checked (the existing code already extends `Window` for `fbq` in `apps/marketing/src/lib/facebook-pixel.ts:8-13`; mirror that):

```ts
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}
```

### 2.3 Canonical `track()` bridge -> dataLayer

Introduce a single typed helper that **all** components import, replacing scattered calls. Today the canonical helper is `apps/marketing/src/lib/analytics.ts` (e.g. `trackQuickAddToCart` at line 132). Each `track*` function will gain a `pushToDataLayer()` call alongside its existing `fbq` + backend POST calls, so during parallel run GTM receives the same event_id the direct pixel uses.

Push shape (GA4 ecommerce-aligned so the sGTM GA4 client parses it natively):

```ts
dataLayer.push({ ecommerce: null }); // reset to avoid stale items
dataLayer.push({
  event: "add_to_cart",
  event_id: eventId,                 // SAME id passed to fbq({eventID}) + backend
  fbp: getFbp(), fbc: getFbc(),      // read in browser (lib/meta-cookies.ts)
  user_data: { email_hashed?: ..., external_id?: userId }, // hashed/opaque only, never raw PII
  ecommerce: {
    currency: "AED",
    value: price,
    items: [{ item_id: contentId, item_name: name, price, quantity }],
  },
});
```

**Privacy rule (hard):** never push raw email/phone to the dataLayer — it is readable by every third-party script and shows in the browser console. Push only SHA-256-hashed PII or an opaque `external_id`; let sGTM do the authoritative hashing for server tags. The existing `setPixelUser()` in `lib/facebook-pixel.ts:42-63` already hashes/normalizes before passing to the pixel — reuse those `normalizeEmail`/`normalizePhone` helpers from `@ecommerce/shared-utils` for any dataLayer PII.

### 2.4 Consent Mode v2 (no banner — UAE-only)

This store is **UAE-only**. There is **no consent banner and no CMP**. The codebase already took this position for Meta tracking (`docs/meta-ads-integration-phases.md` F17: "No — UAE-only today"; UAE-PDPL does not require a GDPR/ePrivacy-style opt-in banner). GTM follows the same rule:

- **Consent Mode v2 defaults are set to ALL GRANTED synchronously, before `gtm.js` loads** (shown in 2.1). This still matters: an explicit `granted` default tells Google to model/attribute conversions in full rather than applying behavioural modelling for "unknown" consent states. It costs nothing and improves GA4 data completeness.
- **No CMP, no `gtag('consent','update',...)`, no banner UI, no `localStorage` flag.** If a future expansion adds an EU presence, add the banner then (see "Future: non-UAE expansion" below).
- Tag the Meta Pixel tag, GA4 config tags in GTM with consent types (`ad_storage` / `analytics_storage`) regardless — they are granted by default, but the consent typing keeps the container correct if a banner is ever added.
- Backend CAPI (`meta-capi.ts`) and sGTM server tags fire **unconditionally** (no `marketingConsented` flag) — consistent with the current unconditional Pixel + CAPI behaviour.

**Future: non-UAE expansion.** If the store ever serves EU/EEA traffic, add at that point: a default-denied banner, `gtag('consent','update',{...granted})` on accept, a `marketingConsented` flag threaded client -> track body -> sGTM payload (omit hashed `em`/`ph`/`fn`/`ln` when denied), and Pixel/CAPI gating. This is the F5/F17 finding in `META_PIXELS_&_CAPI_REVIEW.md`. Do not build it speculatively (YAGNI — see `docs/meta-ads-integration-phases.md`).

### 2.5 SPA route-change PageView

The existing `PageViewTracker` (`apps/marketing/src/components/analytics/page-view-tracker.tsx:7-21`) already fires `fbPageView()` on `usePathname()`/`useSearchParams()` change (deduped by a ref). Extend it to also push a virtual pageview to the dataLayer so GTM's History Change / Custom Event trigger re-fires GA4 `page_view`:

```ts
dataLayer.push({ event: "page_view", page_path: pathname, page_location: window.location.href });
```

Guard against **Page View + History Change overlap** in the GTM container (Phase 3): restrict the GA4 `page_view` trigger to History Change only, or deduplicate on initial load, so the first navigation does not fire two pageviews.

### 2.6 Migrating the 15 events

Each existing `track*()` in `apps/marketing/src/lib/analytics.ts` keeps its `fbq(...)` + backend POST calls (parallel run) and adds a `pushToDataLayer()` call. The `event_id` generation in `genEventId()` (line 69-74, `crypto.randomUUID()`) is reused verbatim — the SAME id flows to: (a) `fbq(..., { eventID })`, (b) backend track body (`eventId`), and now (c) the dataLayer `event_id`. The full event-name mapping is in the Phase 3 table.

---

## Phase 3 — Build the sGTM Container Config

### 3.1 Clients (parse incoming hits)

| Client | Purpose | Notes |
|---|---|---|
| **GA4 (Web) client** (built-in) | Parses browser GA4 hits arriving at the first-party endpoint `metrics.capellauae.com/g/collect` | Primary ingest. Set claim URLs so it only claims `/g/collect` and `/gtm/js`. |
| (Optional) **HTTP Request client** | Parses backend POSTs (Phase 4 option B) | Community template; only needed if backend proxies webhook Purchase through sGTM. |

### 3.2 Server tags

| Tag | Template | Fires on | Forwards to |
|---|---|---|---|
| **Meta Conversions API** | Stape community template "Meta Conversions API" (or Google's CAPI template) | Each conversion event | `graph.facebook.com/<v>/<pixel>/events` using `META_CAPI_ACCESS_TOKEN` |
| **GA4 Measurement Protocol** | Built-in "Google Analytics (GA4)" | All events | `www.google-analytics.com/g/collect` using `GA4_MEASUREMENT_ID` + `GA4_MP_API_SECRET` |

### 3.3 Transport URL / first-party domain

- In the **Server container settings**, set the **Server Container URL** to `https://metrics.capellauae.com`.
- In the **browser GA4 configuration** (inside client GTM), set the **transport_url** / `server_container_url` to `https://metrics.capellauae.com` so browser GA4 hits go to your sGTM, not `google-analytics.com` directly. The `gtag('set','server_url',...)` in 2.1 also covers this.
- Verify `_fbp`/`_fbc` survive the hop: because `metrics.capellauae.com` shares the registrable domain with `capellauae.com`, first-party cookies scoped to `.capellauae.com` are sent on the request to sGTM; the GA4 client also reads them from the request and exposes them as variables the Meta CAPI tag maps to `fbp`/`fbc`.

### 3.4 `server_container_config.json` and export

- **Runtime config:** delivered via `SGTM_CONTAINER_CONFIG` env (Phase 1.3). Contains signing keys, not the workspace.
- **Workspace export:** `Admin -> Export Container` -> save as `sgtm/workspace-export.json` -> commit to repo. Re-import on any new container. This is the auditable source of truth for clients/tags/triggers.

### 3.5 Event mapping table (14 existing events -> dataLayer event -> sGTM tags)

| # | Existing event | dataLayer `event` | GA4 MP | Meta CAPI | event_id source | Notes |
|---|---|---|---|---|---|---|
| 1 | PageView | `page_view` | yes | no (browser pixel covers it) | n/a | SPA route change (`page-view-tracker.tsx`) |
| 2 | ViewContent (product) | `view_item` | yes | yes (optional) | client UUID | Dedup ref in `analytics.ts:85` |
| 3 | ViewContent (category) | `view_item_list` | yes | optional | client UUID | `analytics.ts:101` |
| 4 | Search | `search` | yes | optional | client UUID | `analytics.ts:119` |
| 5 | AddToCart | `add_to_cart` | yes | yes | client UUID (F1-fixed) | `analytics.ts:132`, eventId now threaded |
| 6 | RemoveFromCart | `remove_from_cart` (custom) | yes | **no** (F4) | client UUID | Keep out of CAPI (not optimizable) |
| 7 | AddToWishlist | `add_to_wishlist` | yes | yes | client UUID | `analytics.ts:208` |
| 8 | InitiateCheckout | `begin_checkout` | yes | yes | client UUID (F1-fixed) | `analytics.ts:229` |
| 9 | AddPaymentInfo | `add_payment_info` | yes | yes | client UUID | checkout useEffect |
| 10 | Purchase (COD) | `purchase` | yes | yes | `order_${orderId}` | Deterministic; matches backend |
| 11 | Purchase (Ziina, server-only) | (backend path) | yes (optional) | yes | `order_${orderId}` | See Phase 4; no browser event |
| 12 | CompleteRegistration | `sign_up` | yes | yes | `register_${userId}` | Backend-anchored id |
| 13 | Lead | `generate_lead` | yes | yes | `lead_<uuid>` | F14: drop email from id |
| 14 | Checkout abandon (custom) | `checkout_abandon` | yes (internal) | no | client UUID | Custom; audience-only |

---

## Phase 4 — Preserve Meta Deduplication + Backend CAPI Decision

The existing dedup contract (from `META_EVENTS_ARCHITECTURE.md`) must survive the move to sGTM. The contract is: **browser event_id === server event_id === sGTM event_id**, plus matching `event_name` and agreement on `_fbp`.

### 4.1 How dedup survives the sGTM hop

1. Client generates `event_id` (existing `genEventId()` -> `crypto.randomUUID()`, or deterministic `order_${orderId}` / `register_${userId}`).
2. Client pushes `{ event, event_id, ecommerce, ... }` to dataLayer.
3. Client GTM fires the **Meta Pixel tag** with `eventID = {{event_id}}` (browser hit to facebook).
4. Client GTM's GA4 tag sends the hit to sGTM with `event_id` in the payload.
5. sGTM's **Meta CAPI tag** reads the same `{{event_id}}` variable and sets `event_id` on the CAPI POST.
6. Meta receives (browser Pixel, server CAPI) with identical `(event_name, event_id)` and `_fbp` -> collapses to **one** event.

In the GTM container, the `eventID` field on the **browser** Meta tag and the `event_id` field on the **server** Meta CAPI tag must read the **same dataLayer variable** (`{{event_id}}`). This is the single most important GTM wiring check.

### 4.2 `_fbp` / `_fbc` through sGTM

- Browser generates `_fbp`/`_fbc` (Meta Pixel sets them). They persist as first-party cookies on `.capellauae.com`.
- Because sGTM lives at `metrics.capellauae.com` (same registrable domain), the cookies ride along on the GA4 hit to sGTM automatically (no `credentials: 'include'` gymnastics, no CORS — it's same-site).
- The GA4 client in sGTM exposes `{{ fb.1..... }}`-style first-party cookie variables; map them to the Meta CAPI tag's `fbp` / `fbc` fields. Verify in sGTM Preview that these variables are non-empty.
- For the **Ziina webhook** path, the user has left the site. `_fbp`/`_fbc` were already persisted on the order at checkout (the clean pattern at `apps/backend/src/modules/payment/service.ts` per the review doc). That persistence is independent of sGTM and continues to work.

### 4.3 Backend CAPI decision (recommendation table)

The async, server-only Purchase (Ziina webhook) cannot originate from a browser->sGTM hit. Two options:

| Option | Mechanism | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **A. Keep backend calling Graph API directly** | `apps/backend/src/lib/meta-capi.ts:191` unchanged | Already correct: per-field SHA-256, retry/backoff (3x), `event_source_url`, prod-guarded test code, Graph v23.0. Zero migration risk. | Two hashing sources (backend + sGTM) | **Phase 4/6 (parallel) — keep this.** Default at cutover unless centralization is wanted. |
| **B. Backend POSTs to sGTM; sGTM fires Meta CAPI** | Backend `POST https://metrics.capellauae.com/...` with event payload; an HTTP Request client in sGTM parses; Meta CAPI tag fires | Single hashing source (sGTM). Consistent `event_source_url`/`action_source`. Centralized audit. | Requires custom sGTM client + new backend code; sGTM becomes a hard dependency for Purchase | **Optional Phase 7 (cutover)** if you want one CAPI source of truth. |

**Recommended:** During parallel and at cutover, **keep option A** for the backend webhook Purchase (it already works and dedupes against the browser Purchase via `order_${orderId}`). Move only the **browser-originated** CAPI events into sGTM. Revisit B only if operational centralization is prioritized over minimal change.

### 4.4 Deterministic vs UUID event_id summary (unchanged from current code)

| Event | event_id | Generated where | Why |
|---|---|---|---|
| Purchase (COD + Ziina) | `order_${orderId}` | DB id | Stable across browser + webhook; survives retries |
| CompleteRegistration | `register_${userId}` | backend | Entity-anchored |
| Lead | `lead_<uuid>` | client (F14: no email in id) | Client forwards to backend + dataLayer |
| AddToCart / InitiateCheckout / others | `crypto.randomUUID()` | client (`analytics.ts:69`) | F1 fix already applied |

---


## Phase 6 — Parallel Run + Measurement

### 6.1 Parallel-run configuration (zero double-counting)

During parallel run:

- **Meta:** keep the existing direct path exactly as-is (`fbq` + backend `sendMetaEvent`). Add the GTM/sGTM path but route **only GA4** through sGTM. Do **not** enable the sGTM Meta CAPI tag for Meta yet. Result: Meta sees the same events as today (no change, no duplication); GA4 comes online as a new channel.
- Gate everything with a feature flag `NEXT_PUBLIC_TRACKING_MODE`:
  - `legacy` (default at start of Phase 6) = direct Meta only, no GTM.
  - `parallel` = direct Meta + GTM+sGTM (GA4 only through sGTM).
  - `sgtm_meta` = add sGTM Meta CAPI tag, but disable direct backend CAPI for browser-originated events (keep webhook path direct). Use the **same** `event_id` so any overlap dedupes.
  - `full` = sGTM manages all browser-originated Meta CAPI; direct fbq removed.

### 6.2 Kill-switch

- `NEXT_PUBLIC_TRACKING_MODE=legacy` instantly reverts the storefront to today's behavior (one env change + redeploy of marketing).
- On sGTM: pause the Meta CAPI / GA4 server tags from the GTM UI (no redeploy needed) to stop all forwarding instantly.
- Backend: `META_ACCESS_TOKEN` unset -> `sendMetaEvent` no-ops with a warning (existing graceful degradation at `meta-capi.ts:219-222`).

### 6.3 Measurement plan (before / after)

| Signal | Tool | Baseline (Phase 0) | Target (Phase 6/7) |
|---|---|---|---|
| Meta Purchase EMQ | Events Manager -> Event Match Quality | record baseline (target 6+/10) | >= baseline; ideally +1-2 with sGTM richer user_data + external_id |
| Meta dedup ratio | Events Manager -> "Deduplicated" column | record (Browser vs Server counts) | Server count ~ equals Browser count per event; dedup ratio high |
| GA4 events | GA4 DebugView (`?gtm_debug=x`) | n/a (new) | All 14 events appear with correct `currency=AED`, `value`, `transaction_id` |
| sGTM health | sGTM Preview mode + `docker logs capella-sgtm` | n/a | `fbp_present`/`fbc_present` true on CAPI events; no 4xx/5xx to vendors |

Use **GTM Tag Assistant** (browser) and **sGTM Preview** (server) together: Tag Assistant confirms the dataLayer push + browser tag firing; sGTM Preview confirms the server tag firing + the variables it resolved (especially `event_id`, `fbp`, `fbc`). The `?gtm_debug=x` URL parameter opens both linked.

### 6.4 Parallel-run success criteria (gate to cutover)

- 7 consecutive days of GA4 DebugView showing all 14 events with correct AED values and no duplicates.
- Meta Events Manager dedup ratio unchanged or improved vs baseline.
- sGTM logs show `fbp_present=true` on >= 90% of Meta CAPI events (browser-linking intact).
- No regression in Meta Purchase EMQ vs baseline.

---

## Phase 7 — Cutover + Cleanup

### 7.1 Cutover sequence (per `NEXT_PUBLIC_TRACKING_MODE`)

1. `legacy` -> `parallel`: deploy marketing with GTM env vars; verify GA4/Ads live, Meta unchanged.
2. `parallel` -> `sgtm_meta`: in GTM, enable the sGTM Meta CAPI server tag; verify in Events Manager Test Events that the sGTM CAPI event dedupes with the browser Pixel (same `event_id`, dedup column shows 1). Keep backend webhook Purchase on direct Graph API (option A).
3. `sgtm_meta` -> `full`: remove the hardcoded `fbevents.js` injection (`facebook-pixel.tsx`) — now loaded by a GTM tag; remove direct `fbq(...)` calls from `lib/facebook-pixel.ts` (the wrappers become dataLayer pushers only); remove backend `sendMetaEvent` calls for **browser-originated** events (keep the Ziina webhook call).

### 7.2 Decommission

- Delete the `FacebookPixel` direct-injection component and its `<head>` usage at `app/[locale]/layout.tsx:117`.
- Convert `apps/marketing/src/lib/facebook-pixel.ts` wrappers to pure dataLayer pushers (or delete if GTM Custom HTML handles the pixel).
- Backend: keep `meta-capi.ts` for the Ziina webhook path (option A) OR replace with an sGTM POST helper (option B).
- Remove `META_TEST_EVENT_CODE` from all prod environments (it must never ship to prod — `meta-capi.ts:225-230` already guards this).

### 7.3 Rollback criteria

Roll back to `legacy` (immediate) if any of:
- Meta Events Manager shows **duplicate** Purchase/AddToCart/InitiateCheckout events (dedup broken).
- Meta Purchase EMQ drops > 1.0 below baseline for > 48h.
- sGTM container goes unhealthy and `metrics.capellauae.com/healthy` fails (GA4 goes dark).
- A privacy incident (raw PII observed in dataLayer / sGTM logs).

Rollback = set `NEXT_PUBLIC_TRACKING_MODE=legacy`, redeploy marketing, pause all sGTM server tags. Backend Meta keeps working throughout (it never depended on sGTM).

---

## Environment Variables

| Service | Variable | Purpose | Required |
|---|---|---|---|
| marketing | `NEXT_PUBLIC_GTM_ID` | Client GTM container id (`GTM-XXXXXXX`) | Yes (parallel+) |
| marketing | `NEXT_PUBLIC_SGTM_URL` | sGTM first-party endpoint (`https://metrics.capellauae.com`) | Yes (parallel+) |
| marketing | `NEXT_PUBLIC_TRACKING_MODE` | `legacy` / `parallel` / `sgtm_meta` / `full` kill-switch | Yes |
| marketing | `NEXT_PUBLIC_GA4_ID` | GA4 Measurement ID (`G-XXXXXXXX`) — used by client GA4 config tag | Yes (parallel+) |
| marketing | `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Meta Pixel id (existing; reused by GTM Meta tag) | Yes |
| marketing | `NEXT_PUBLIC_API_URL` | Backend URL (existing) | Yes |
| marketing | `NEXT_PUBLIC_SITE_URL` | Site URL (existing) | Yes |
| backend | `META_PIXEL_ID` | Existing; used by webhook CAPI | Yes |
| backend | `META_ACCESS_TOKEN` | Existing; backend webhook CAPI (option A) | Yes |
| backend | `META_TEST_EVENT_CODE` | Test events; must be unset in prod | No (dev/test only) |
| backend | `META_API_VERSION` | Graph API version (default `v23.0`) | No |
| sGTM (Coolify) | `SGTM_CONTAINER_CONFIG` | THE ONLY container env var. Runtime config blob (Manually provision → paste). Re-paste after every server publish. | Yes |
| sGTM (Coolify) | `SGTM_PREVIEW_SERVER_URL` | Optional. Only if the preview service is enabled (`metrics-preview.capellauae.com`). | No |
| sGTM (GTM UI, not env) | GA4_MEASUREMENT_ID / GA4_MP_API_SECRET | Entered into the GA4 MP **server tag** in the GTM UI; compiled into `CONTAINER_CONFIG`. See `GTM_DASHBOARD_PLAYBOOK.md`. | Yes |
| sGTM (GTM UI, not env) | META_PIXEL_ID / META_CAPI_ACCESS_TOKEN | Entered into the Meta CAPI **server tag** in the GTM UI; compiled into `CONTAINER_CONFIG`. | Yes |
| sGTM (GTM UI, not env) | Server container URL | Set at Admin → Container Settings → Server container URL = `https://metrics.capellauae.com` (NOT an env var). | Yes |
| sGTM (GTM UI, not env) | `META_TEST_EVENT_CODE` | Test events; unset in the prod server publish. | No |
| Coolify infra | `COOLIFY_DB_NETWORK` | External bridge network name (default `coolify`) | Yes |

---

## Validation Checklist (expanded for GA4)

Mirrors the 15-event checklist in `META_EVENTS_ARCHITECTURE.md` and adds the new channels.

### Meta (must not regress)
- [ ] PageView fires once per SPA navigation in Events Manager
- [ ] ViewContent (product) and ViewContent (category) both appear
- [ ] Search appears from header + overlay
- [ ] AddToCart appears from card / PDP / quick-view
- [ ] AddToWishlist appears
- [ ] InitiateCheckout appears on checkout open
- [ ] AddPaymentInfo appears on payment-method change
- [ ] Purchase (COD) shows exactly ONE deduplicated event (`order_${id}`)
- [ ] Purchase (Ziina) shows ONE server-only event
- [ ] CompleteRegistration shows ONE deduplicated event (`register_${userId}`)
- [ ] Lead shows ONE deduplicated event + owner email fires
- [ ] Cancel checkout fires custom abandon event
- [ ] Purchase EMQ >= baseline; ideally 6+/10 with `external_id` + `country=ae`

### GTM / dataLayer
- [ ] `window.dataLayer` initialized before `gtm.js`
- [ ] Consent Mode v2 defaults ALL GRANTED (no banner, UAE-only); tags consent-typed for future banner
- [ ] Every dataLayer push has `event` + `event_id` (where dedup applies) + GA4 ecommerce payload
- [ ] No raw PII in dataLayer (hashed/opaque only)
- [ ] Route change pushes `page_view`; no PageView+HistoryChange double-fire on initial load

### sGTM
- [ ] `metrics.capellauae.com/healthy` returns `ok`
- [ ] Preview port NOT publicly reachable
- [ ] GA4 client claims only `/g/collect` + `/gtm/js`
- [ ] Meta CAPI server tag `event_id` === browser Meta tag `eventID` (same variable)
- [ ] sGTM Preview shows `fbp` / `fbc` resolved (non-empty) on CAPI events
- [ ] `server_container_config` loaded; workspace export committed to repo

### GA4 (new)
- [ ] DebugView shows all 14 events with `currency=AED` and correct `value`
- [ ] Purchase carries `transaction_id` = order id

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| sGTM Meta CAPI tag uses a different `event_id` than the browser tag -> dedup breaks, double-count | Medium | High (corrupts Meta optimization) | Both tags read the SAME `{{event_id}}` dataLayer variable; verify in sGTM Preview + Events Manager Test Events before enabling `sgtm_meta` mode |
| `_fbp`/`_fbc` not reaching sGTM (cookies blocked / ITP / wrong domain) -> EMQ drops | Medium | High | Use same-registrable-domain subdomain `metrics.capellauae.com`; verify `fbp_present` in sGTM logs; keep option-A backend CAPI as fallback for webhook events |
| Preview port accidentally exposed -> container tampering | Low | Critical | Never map preview port to host; Cloudflare Access or IP allowlist on preview range |
| (Future only) Consent banner mishandled -> no tags fire | Low today (no banner) | High if added later | Not applicable while UAE-only; when a banner is added, test accept path in GTM Preview and monitor GA4 DebugView |
| Raw PII leaked into dataLayer (email/phone in plaintext) | Medium | High (privacy/legal) | Hard rule: push hashed/opaque only; centralize hashing in sGTM; grep dataLayer pushes in code review |
| Duplicate `page_view` from Page View + History Change overlap | High | Medium | Use History Change trigger only; restrict Page View trigger to first load |
| sGTM container unhealthy -> GA4 goes dark | Low | Medium | `/healthy` healthcheck + Coolify restart policy; `TRACKING_MODE=legacy` kill-switch; backend Meta unaffected |
| React Strict Mode double-firing tracking events in dev | High (dev only) | Low (dev only) | Confirm duplication is dev-only; do not add ad-hoc dedup that under-counts in prod |
| `CONTAINER_CONFIG` rotation invalidates running sGTM | Low | Medium | Redeploy after rotation; keep workspace export in git for fast restore |
| Backend webhook Purchase lost on Graph API blip (option A) | Low | High | Existing retry/backoff (`meta-capi.ts:315-359`, 3 attempts, exponential backoff) persists; consider a replay queue within Meta's 7-day window |
| `META_TEST_EVENT_CODE` leaks to prod | Low | Medium | `meta-capi.ts:225-230` already guards; mirror the same guard in sGTM (unset env in prod) |
| Currency mismatch (non-AED slips through) | Low | Medium | Make `currency` explicit per event (F8); assert `AED` in GA4 DebugView |
