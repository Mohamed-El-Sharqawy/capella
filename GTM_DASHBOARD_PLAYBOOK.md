# GTM + sGTM Dashboard Playbook (Phase 3)

> Scope: an exact, click-by-click walkthrough for building the **client (Web) GTM container** and the **server (sGTM) container** that the migration plan (`GTM_SGTM_MIGRATION_PLAN.md`) and the events architecture (`META_EVENTS_ARCHITECTURE.md`) depend on.
>
> This is the dashboard-only phase. It does not modify application code. The dataLayer events, the `event_id` dedup contract, and the `_fbp`/`_fbc` cookie reads all already exist in the codebase (`apps/marketing/src/lib/gtm.ts`, `apps/marketing/src/lib/meta-cookies.ts`); this document wires the GTM containers to consume them.

---

## Store Facts (reference — do not deviate)

| Item | Value |
|---|---|
| Domain | `capellauae.com` (UAE-only) |
| Currency | `AED` everywhere (`packages/shared-utils/src/meta.ts:11`) |
| Client (Web) GTM container | `GTM-NPQT2ZKL` |
| GA4 Measurement ID | `G-V0F7MTSEFB` (Stream ID `15352822948`, stream "Capella UAE", URL `https://capellauae.com`) |
| GA4 Measurement Protocol API secret | `7sej6w5kROuj0WU7TztK1w` |
| Meta Pixel | `961780093407076` |
| sGTM first-party endpoint | `https://metrics.capellauae.com` |
| sGTM-scoped Meta CAPI token | `META_CAPI_ACCESS_TOKEN` (already in `apps/sgtm/.env`) |
| Meta test event code (dev only) | `TEST66310` |
| Google Ads | none (do not add Google Ads tags or Conversion Linker) |
| Consent banner | none (UAE-only). Consent Mode v2 defaults are already ALL GRANTED by the code (`apps/marketing/src/components/analytics/gtm-script.tsx:33-41`). Tags must still be consent-typed (`ad_storage` / `analytics_storage`). |

---

## The 14 dataLayer events (already pushed by the code)

Source of truth: `apps/marketing/src/lib/gtm.ts` (every push resets `ecommerce:null` first at `gtm.ts:71`, then pushes a GA4-shaped object). Event names and `event_id` rules below are read straight from that file.

| # | dataLayer `event` | Carries `event_id`? | `event_id` value | GA4 ecommerce payload |
|---|---|---|---|---|
| 1 | `page_view` | no | — | none (route change) |
| 2 | `view_item` | no | — | `items`, `value`, `currency` |
| 3 | `view_item_list` | no | — | `items`, `currency` |
| 4 | `search` | no | — | optional `items`, `search_term` |
| 5 | `add_to_cart` | yes | client UUID | `items`, `value`, `currency` |
| 6 | `remove_from_cart` | yes (custom) | client UUID | `items`, `value`, `currency` |
| 7 | `add_to_wishlist` | no | — | `items`, `value`, `currency` |
| 8 | `begin_checkout` | yes | client UUID | `items`, `value`, `currency` |
| 9 | `add_payment_info` | no | — | `items`, `value`, `currency` |
| 10 | `purchase` | yes | `order_<orderId>` | `transaction_id`, `items`, `value`, `currency` |
| 11 | `generate_lead` | yes | `lead_<uuid>` | `value`, `currency` |
| 12 | `sign_up` | yes | `register_<userId>`-style (backend response) | `method` |
| 13 | `checkout_abandon` | no | — | `items`, `value`, `currency` |
| 14 | `gtm.js` | no | — | container init (DOM Ready) |

Reference lines: `add_to_cart` (`gtm.ts:121-139`), `begin_checkout` (`gtm.ts:176-192`), `purchase` (`gtm.ts:206-223`, `event_id = order_${orderId}`, `transaction_id = orderId`), `generate_lead` (`gtm.ts:226-236`), `sign_up` (`gtm.ts:239-246`), `remove_from_cart` (`gtm.ts:141-158`).

### Meta standard event mapping (dataLayer event -> Meta `event_name`)

| dataLayer `event` | Meta `event_name` | Forward to Meta CAPI? |
|---|---|---|
| `page_view` | `PageView` | no (browser Pixel covers it; CAPI PageView optional) |
| `view_item` / `view_item_list` | `ViewContent` | yes (optional) |
| `search` | `Search` | yes (optional) |
| `add_to_cart` | `AddToCart` | yes |
| `add_to_wishlist` | `AddToWishlist` | yes |
| `begin_checkout` | `InitiateCheckout` | yes |
| `add_payment_info` | `AddPaymentInfo` | yes |
| `purchase` | `Purchase` | yes |
| `generate_lead` | `Lead` | yes |
| `sign_up` | `CompleteRegistration` | yes |
| `remove_from_cart` | — | no (custom, audience-only) |
| `checkout_abandon` | — | no (custom, audience-only) |

---

## Part A — Client (Web) Container `GTM-NPQT2ZKL`

All steps are in the GTM UI at `https://tagmanager.google.com`. Select the workspace containing container `GTM-NPQT2ZKL`.

### A.1 Open the workspace

1. GTM left rail -> **Workspaces** -> open the default workspace (or create a named workspace, e.g. `phase3-ga4-meta`).
2. All artifacts below (Tags, Triggers, Variables) are created in this workspace and published together in **A.8**.

### A.2 GA4 Configuration tag

This tag initializes GA4 once, sends the initial `page_view`, and (critically) redirects browser GA4 hits to the self-hosted sGTM endpoint instead of `google-analytics.com`.

1. **Tags** -> **New**.
2. Rename tag: `GA4 Configuration - Capella UAE`.
3. **Tag Configuration** -> **Choose a tag type** -> **Google Analytics: GA4 Configuration**.
4. **Measurement ID**: `G-V0F7MTSEFB`.
5. **Server Container URL**: in the 2025 GA4 Configuration tag UI this is a dedicated text field located directly beneath the *Measurement ID* / *Configuration Parameters* block, under a section headed **"Server-side tagging"** (sometimes labelled **"Server Container URL"**). Enter:
   ```
   https://metrics.capellauae.com
   ```
   If you do not see the dedicated field in your UI revision, add it as a **Configuration Parameter**: key `server_container_url`, value `https://metrics.capellauae.com`. Both resolve to the same GA4 config field.
   > Belt-and-suspenders: the code also sets this client-side via `gtag('set','server_url',...)` in `apps/marketing/src/components/analytics/gtm-script.tsx:23`. Setting it in the GA4 config tag is the canonical place and keeps it container-controlled.
6. **Send a page view when the page loads** (the "Send Page View" checkbox in the config section): **enabled**. The app pushes its own `page_view` dataLayer event on SPA route change, but the *initial* GA4 page_view is provided by this checkbox.
7. **Triggering** (bottom of the tag) -> choose **Consent Initialization - All Pages** (the built-in trigger that fires before any other tag, synchronously with `gtm.js`). If that trigger is not listed, use the built-in **Initialization - All Pages**. Do NOT use the generic "All Pages" trigger here — initialization triggers run first, which is what we need so GA4 is bootstrapped before the first event.
8. **Advanced Settings** -> **Consent settings** -> under "Additional consent checks", add **`ad_storage`** and **`analytics_storage`**, both defaulting to *granted* (UAE-only; see A.6). This is required even though consent is granted by default — it keeps the tag correct if a banner is ever added.
9. **Save**.

> Note on double page_view: the app pushes `page_view` on SPA route change. The GA4 config tag's "Send Page View" checkbox fires only on the container's initial load, so it does NOT collide with the SPA `page_view` pushes. Do NOT add a separate *Page View* built-in trigger anywhere (see A.5 warning).

### A.3 Meta Pixel — Custom HTML (init) tag

Mirrors `apps/marketing/src/components/analytics/facebook-pixel.tsx:17-33` exactly: init the Pixel, turn off `autoConfig` (manual Advanced Matching keeps browser and server `em`/`ph` hashes in agreement), and fire the initial `PageView`.

1. **Tags** -> **New**.
2. Rename tag: `Meta Pixel - Init + PageView`.
3. **Tag Configuration** -> **Choose a tag type** -> **Custom HTML**.
4. Paste the following (Pixel ID `961780093407076`):

   ```html
   <script>
     !function(f,b,e,v,n,t,s)
     {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
     n.callMethod.apply(n,arguments):n.queue.push(arguments)};
     if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
     n.queue=[];t=b.createElement(e);t.async=!0;
     t.src=v;s=b.getElementsByTagName(e)[0];
     s.parentNode.insertBefore(t,s)}(window, document,'script',
     'https://connect.facebook.net/en_US/fbevents.js');
     fbq('init', '961780093407076');
     // autoConfig OFF: Advanced Matching is handled manually so browser
     // ph/em hashes match the server's normalizePhone/normalizeEmail.
     fbq('set', 'autoConfig', 'false', '961780093407076');
     fbq('track', 'PageView');
   </script>
   ```
5. **Triggering** -> **Consent Initialization - All Pages** (or **Initialization - All Pages**). It must run before the conversion-event tags so `fbq` is defined when they fire.
6. **Advanced Settings** -> **Tag sequencing**: leave default (this is the init). **Consent settings**: add `ad_storage` and `analytics_storage` (granted by default; A.6).
7. **Save**.

> Parallel-run caution: during Phase 6 (`NEXT_PUBLIC_TRACKING_MODE = parallel`), the storefront still renders the direct `<FacebookPixel />` component (`app/[locale]/layout.tsx:117`). Both the direct script and this GTM tag would init `fbevents.js` and double-fire `PageView`. Until you cut over to `sgtm_meta`/`full` (and remove the direct component), enable **only one** path. Recommended: publish this GTM tag **paused** during `parallel`, and unpause it only when the direct component is removed. The browser `fbq` SDK dedupes a second `init` call, but the duplicate `track('PageView')` would not be deduped.

### A.4 GA4 Event tags (decision + table)

**Decision: one GA4 Event tag per dataLayer event, triggered by its own Custom Event trigger, with "Include Ecommerce Data" enabled.**

Why this over the alternatives:

- **GA4 does not auto-fire ecommerce events from the dataLayer.** The GA4 Configuration tag only emits `page_view`. The `ecommerce` object that `gtm.ts` pushes is attached to a GA4 event **only** when a GA4 Event tag explicitly reads it (via the "Include Ecommerce Data" checkbox, which reads the `ecommerce` dataLayer variable). With no GA4 Event tag, no ecommerce event hit is sent to sGTM. So a GA4 Event tag **is required** for each event we want in GA4.
- The `ecommerce:null` reset (`gtm.ts:71`) is good GA4 hygiene (prevents stale items leaking into the next event) but is orthogonal to whether tags fire.
- Per-event tags (vs. one generic `{{Event}}` tag) are auditable, map 1:1 to the Meta CAPI event mapping, and make it trivial to pause / inspect a single event in Preview. The trade-off is more artifacts (13 event tags), which is acceptable for a fixed 14-event catalog.

> Alternative (documented, not recommended primary): a single GA4 Event tag whose event name is the built-in `{{Event}}` variable, triggered by one Custom Event trigger using a regex of all 13 event names. Lower maintenance but harder to audit and no per-event control. Use only if container size becomes a concern.

For every GA4 Event tag below, configure the tag the same way:

- Tag type: **Google Analytics: GA4 Event**.
- **Configuration Tag**: `GA4 Configuration - Capella UAE` (the tag from A.2). This binds the event to measurement `G-V0F7MTSEFB` and inherits the server container URL.
- **Event Name**: the GA4 event name from the table (equals the dataLayer `event`).
- **Include Ecommerce Data**: **checked**. Data source: **Data Layer** (reads the `ecommerce` object that `gtm.ts:71-72` pushes). This auto-attaches `transaction_id`, `value`, `currency`, `items` for `purchase`, etc.
- **Event Parameters** (optional): add `event_id` = `{{event_id}}` (the variable from Part C) so the dedup id rides to sGTM in the GA4 payload too. Harmless for events that have no `event_id` (resolves to undefined).
- **Triggering**: the matching Custom Event trigger from A.5.
- **Consent settings**: `ad_storage` + `analytics_storage` (granted; A.6).

| dataLayer event | GA4 Event tag name | GA4 Event Name | Trigger | Include Ecommerce Data | Notes |
|---|---|---|---|---|---|
| `page_view` | `GA4 Event - page_view` | `page_view` | CE - page_view | off | Optional: the config tag already sends initial page_view. Add this only if you want every SPA `page_view` push to also forward to GA4 (recommended, so client-side route changes appear in GA4). |
| `view_item` | `GA4 Event - view_item` | `view_item` | CE - view_item | on | |
| `view_item_list` | `GA4 Event - view_item_list` | `view_item_list` | CE - view_item_list | on | |
| `search` | `GA4 Event - search` | `search` | CE - search | on | also sends `search_term` (already in the push, `gtm.ts:115`) |
| `add_to_cart` | `GA4 Event - add_to_cart` | `add_to_cart` | CE - add_to_cart | on | `event_id` forwarded |
| `remove_from_cart` | `GA4 Event - remove_from_cart` | `remove_from_cart` | CE - remove_from_cart | on | custom event; GA4-only, not in Meta |
| `add_to_wishlist` | `GA4 Event - add_to_wishlist` | `add_to_wishlist` | CE - add_to_wishlist | on | |
| `begin_checkout` | `GA4 Event - begin_checkout` | `begin_checkout` | CE - begin_checkout | on | `event_id` forwarded |
| `add_payment_info` | `GA4 Event - add_payment_info` | `add_payment_info` | CE - add_payment_info | on | |
| `purchase` | `GA4 Event - purchase` | `purchase` | CE - purchase | on | `event_id` = `order_<id>`; `transaction_id` present |
| `generate_lead` | `GA4 Event - generate_lead` | `generate_lead` | CE - generate_lead | on | `event_id` forwarded |
| `sign_up` | `GA4 Event - sign_up` | `sign_up` | CE - sign_up | on (no items) | also sends `method` (`gtm.ts:244`) |
| `checkout_abandon` | `GA4 Event - checkout_abandon` | `checkout_abandon` | CE - checkout_abandon | on | custom event; GA4-only, not in Meta |

### A.5 Custom Event triggers

One Custom Event trigger per dataLayer event name. Trigger type = **Custom Event**, match = **Equals** (use **matches RegEx** only if you consolidate per the A.4 alternative).

| Trigger name | Event name (Equals) | Fires on | Used by |
|---|---|---|---|
| CE - page_view | `page_view` | SPA route change push | GA4 Event - page_view |
| CE - view_item | `view_item` | product detail view | GA4 Event - view_item |
| CE - view_item_list | `view_item_list` | collection/category view | GA4 Event - view_item_list |
| CE - search | `search` | search (debounced) | GA4 Event - search |
| CE - add_to_cart | `add_to_cart` | add to cart | GA4 Event - add_to_cart |
| CE - remove_from_cart | `remove_from_cart` | remove from cart | GA4 Event - remove_from_cart |
| CE - add_to_wishlist | `add_to_wishlist` | add to wishlist | GA4 Event - add_to_wishlist |
| CE - begin_checkout | `begin_checkout` | checkout open | GA4 Event - begin_checkout |
| CE - add_payment_info | `add_payment_info` | payment method change | GA4 Event - add_payment_info |
| CE - purchase | `purchase` | order success | GA4 Event - purchase |
| CE - generate_lead | `generate_lead` | contact form submit | GA4 Event - generate_lead |
| CE - sign_up | `sign_up` | registration | GA4 Event - sign_up |
| CE - checkout_abandon | `checkout_abandon` | cancel payment | GA4 Event - checkout_abandon |

**Critical double-pageview warning:** do NOT enable the built-in **History Change** trigger for `page_view` anywhere in this container. The app already pushes `page_view` on every SPA route change (`gtm.ts`-driven, plus the `PageViewTracker` pattern). Adding a History Change trigger alongside the `CE - page_view` trigger would fire two pageviews on the first client-side navigation. Use **only** `CE - page_view` for GA4 page_view forwarding.

### A.6 Consent typing (no banner, UAE-only)

Consent Mode v2 defaults are already set to ALL GRANTED in code (`apps/marketing/src/components/analytics/gtm-script.tsx:33-41`): `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`, `functionality_storage`, `security_storage` all `granted`. There is no banner and no CMP. The consent typing on tags is therefore a no-op today, but it must be present so the container stays correct if a banner is ever added.

- On the **GA4 Configuration**, every **GA4 Event** tag, and the **Meta Pixel** tag: **Advanced Settings** -> **Consent settings** -> add two additional consent checks: **`ad_storage`** and **`analytics_storage`** (both treated as granted by the default state).
- Do not add any `gtag('consent','update',...)` logic, a banner, or a CMP tag.

### A.7 Submit the client workspace

1. **Submit** (top right) -> name the version `Phase 3 - GA4 + Meta client build` -> **Publish**.
2. After publish, reopen **Preview** for the test sequence in Part D.

---

## Part B — Server Container (the sGTM workspace)

Switch to the **Server** container in the same GTM account (the one whose runtime is provisioned on `metrics.capellauae.com` per `GTM_SGTM_MIGRATION_PLAN.md` Phase 1).

### B.1 GA4 (Web) client

The built-in **GA4 (Web)** client parses the `/g/collect` (and legacy `/gtm/js`-driven) hits the browser GA4 config tag sends to `https://metrics.capellauae.com`.

1. **Clients** -> **New**.
2. Client type: **Google Analytics: GA4 (Web)** (built-in).
3. **Measurement ID**: `G-V0F7MTSEFB` (optional but recommended; binds the client to this stream).
4. **Claim path / Include paths**: set so this client claims **only**:
   - `/g/collect`
   - `/gtm/js`
   Do NOT leave it claiming all paths, and do not add an HTTP Request client (no backend-to-sGTM path in this phase; backend keeps calling the Graph API directly per migration plan Phase 4 option A).
5. **Save** -> name it `Client - GA4 Web`.

> Because `metrics.capellauae.com` shares the registrable domain `capellauae.com` with the storefront, the `_fbp` and `_fbc` first-party cookies (set by the browser Meta Pixel on `.capellauae.com`) ride along on the `/g/collect` request automatically. They are then readable inside sGTM as first-party cookie variables (Part C). This is the EMQ-critical hop; verify it resolves non-empty in Preview (Part D).

### B.2 GA4 Measurement Protocol server tag

Forwards the parsed GA4 hit to Google Analytics via the Measurement Protocol (so the data lands in the `G-V0F7MTSEFB` property even though it transited sGTM).

1. **Tags** -> **New**.
2. Tag type: **Google Analytics: GA4** (built-in "Google Analytics (GA4)" server tag).
3. **Measurement ID**: `G-V0F7MTSEFB`.
4. **API Secret**: bind to the Constant variable `{{GA4_MP_API_SECRET}}` (Part C). Do not paste the secret directly into the field — reference the variable. (Stape/built-in tags also accept an environment-variable reference; see the note under Part C.)
5. **Forward all event data / payload**: leave enabled (default) so `transaction_id`, `value`, `currency`, `items`, `event_id` pass through.
6. **Triggering**: **All Events** (the built-in server trigger) OR a trigger scoped to the GA4 client (`Client - GA4 Web`).
7. **Save** -> name it `Server Tag - GA4 MP`.

### B.3 Meta Conversions API server tag

**Recommended template:** the Stape community template **"Meta Conversions API"** (most widely used, supports `event_id`, `fbp`/`fbc` mapping, test event code, and action_source).

- Gallery entry: open the sGTM **Templates** -> **Search Templates** -> **Search Gallery**, search for **Meta Conversions API** by **stape**. Gallery URL (browse):
  ```
  https://tagmanager.google.com/gallery/
  ```
  (Search term: `Meta Conversions API`, owner `stape`. Stape docs: `https://stape.io/`. If the Stape template is unavailable, fall back to Google's official "Conversions API" template from the same gallery.)
- After approval, the tag type appears in Tags -> New -> Tag Configuration.

Configure the tag:

1. **Tags** -> **New** -> Tag Configuration -> **Meta Conversions API** (Stape).
2. **Pixel ID**: `961780093407076`.
3. **Access Token**: reference the runtime env var `META_CAPI_ACCESS_TOKEN` (the Stape template exposes a "token source" option; choose **environment variable** and name it `META_CAPI_ACCESS_TOKEN` — the value already lives in `apps/sgtm/.env`). If the template revision does not support env-var tokens, fall back to the Constant variable `{{META_CAPI_ACCESS_TOKEN}}` (Part C). Never hardcode the literal token in the tag field.
4. **Test Event Code** (dev only): `TEST66310` in the dev/test container only. **Must be empty in production** — set via env so a prod deploy cannot carry it.
5. **Event mapping / fields** (read from the incoming GA4 client event data + the `ecommerce` object the browser pushed):
   - **Event name**: mapped per the Meta standard-event table above. The Stape template reads the incoming event name; since our dataLayer event names differ from Meta's (`add_to_cart` vs `AddToCart`), set the **Event Name Mapping** table in the template:
     - `view_item` -> `ViewContent`
     - `view_item_list` -> `ViewContent`
     - `search` -> `Search`
     - `add_to_cart` -> `AddToCart`
     - `add_to_wishlist` -> `AddToWishlist`
     - `begin_checkout` -> `InitiateCheckout`
     - `add_payment_info` -> `AddPaymentInfo`
     - `purchase` -> `Purchase`
     - `generate_lead` -> `Lead`
     - `sign_up` -> `CompleteRegistration`
     - `page_view` -> `PageView` (only if you enable CAPI PageView; otherwise omit)
     - `remove_from_cart`, `checkout_abandon` -> **exclude** (do not map; audience-only).
   - **event_id**: `{{event_id}}` (Event Data variable, Part C). This is the dedup spine — it must equal the browser Pixel `eventID`. For `purchase` it is `order_<orderId>` (`gtm.ts:214`), for `begin_checkout`/`add_to_cart` the client UUID, etc.
   - **user_data.fbp**: `{{fbp}}` (first-party cookie `_fbp`, Part C).
   - **user_data.fbc**: `{{fbc}}` (first-party cookie `_fbc`, Part C).
   - **value / currency / contents / num_items / content_ids / content_type**: read from the GA4 ecommerce payload (`ecommerce.value`, `ecommerce.currency`, `ecommerce.items`, `ecommerce.transaction_id`). Map:
     - `currency` <- `ecommerce.currency` (always `AED`)
     - `value` <- `ecommerce.value`
     - `content_ids` <- `ecommerce.items[].item_id`
     - `contents` <- `ecommerce.items[]` (`{id, quantity, item_price}`)
     - `content_type` <- `product`
     - `order_id` <- `ecommerce.transaction_id` (purchase only)
   - **action_source**: `website`.
   - **event_source_url**: the page URL from the client request (the template derives this from the incoming request; confirm non-empty in Preview).
   - **client_ip_address** / **client_user_agent**: the template reads these from the incoming request by default (required for `action_source: website`). Confirm in Preview.
6. **Triggering**: scope to conversion events only. Recommended: a trigger that fires on the GA4 client events whose names are in the mapping table above (e.g. a Custom trigger condition `{{Event Name}}` matches RegEx `view_item|view_item_list|search|add_to_cart|add_to_wishlist|begin_checkout|add_payment_info|purchase|generate_lead|sign_up`). Do NOT fire on `remove_from_cart` or `checkout_abandon`.
7. **Save** -> name it `Server Tag - Meta CAPI`.

> Dedup contract check: the browser Meta Pixel (A.3) and this server CAPI tag must carry the **same** `(event_name, event_id)` and agree on `_fbp`. `event_id` is `{{event_id}}` on both sides (browser side reads the same dataLayer value the fbq `eventID` used). Verify with the Test Events dedup column in Part D.4.

### B.4 Server Container URL

1. **Admin** (server workspace) -> **Container settings**.
2. **Server Container URL**: `https://metrics.capellauae.com`.
3. Save. This is the canonical endpoint the client GA4 config tag (A.2) targets.

### B.5 Provision -> CONTAINER_CONFIG

The runtime config tells the self-hosted sGTM container which workspace to run. Best current 2025 UI path (defer to the web-researcher pass for the exact labels if they have moved):

1. In the **Server** container workspace -> **Admin** -> **Container** -> **Install**.
2. Choose **Manually provision server**.
3. Copy the **Container Config** JSON blob (contains the public/signing keys + config; not the workspace export).
4. Paste the full JSON as the value of `SGTM_CONTAINER_CONFIG` in Coolify (env for the sGTM service).
5. Redeploy the sGTM service. On boot it should log `Container config loaded`.
6. Confirm `https://metrics.capellauae.com/healthz` returns 200.

> This blob is runtime config, not the workspace. The workspace (clients/tags/triggers/variables) is exported separately (B.6).

### B.6 Export workspace

1. **Admin** -> **Export Container**.
2. Choose the current workspace; export as JSON.
3. Save the file to the repo as `sgtm/workspace-export.json` (per `GTM_SGTM_MIGRATION_PLAN.md` Phase 1.3) and commit.
4. Re-export after every change. To restore on a new container: **Admin** -> **Import Container** -> select the JSON.

---

## Part C — Variables to Create

### Client (Web) container `GTM-NPQT2ZKL`

| Variable name | Type | Value / config |
|---|---|---|
| `{{event_id}}` | Data Layer Variable | Variable name: `event_id` |

The client container needs only `{{event_id}}` (used by GA4 Event tags to forward the dedup id). `_fbp`/`_fbc` are read **server-side** in sGTM (the cookies ride to sGTM on the `/g/collect` request); the browser GTM does not need cookie variables for them.

### Server container (sGTM)

| Variable name | Type | Value / config |
|---|---|---|
| `{{fbp}}` | First-Party Cookie | Cookie name: `_fbp` |
| `{{fbc}}` | First-Party Cookie | Cookie name: `_fbc` |
| `{{event_id}}` | Event Data | Key path: `event_id` |
| `{{transaction_id}}` | Event Data | Key path: `ecommerce.transaction_id` (used to set Meta `order_id` on purchase) |
| `{{GA4_MP_API_SECRET}}` | Constant | Value: `7sej6w5kROuj0WU7TztK1w` (paste into the Constant; referenced by the GA4 MP tag's API Secret field). Alternatively wire the GA4 MP tag to read the runtime env var of the same name if your tag/template supports it. |
| `{{META_CAPI_ACCESS_TOKEN}}` | Constant | Value: the sGTM-scoped CAPI token (stored in `apps/sgtm/.env` as `META_CAPI_ACCESS_TOKEN`). Paste into the Constant only if the Stape tag cannot read the runtime env var; otherwise prefer the env-var reference in B.3. |
| `{{ecommerce}}` (optional) | Data Layer Variable | Variable name: `ecommerce` — only needed if a tag requires the whole ecommerce object rather than individual fields. The GA4 MP tag reads ecommerce automatically. |

> Secret-handling note: GTM Constant variables store literal values in the workspace export. Treat `sgtm/workspace-export.json` as a secret-bearing artifact (do not commit token/secret values to a public repo). The preferred path is the runtime env-var reference (B.3) so the secret never enters the GTM UI or the export JSON.

---

## Part D — Test Sequence

### D.1 GTM Preview (Tag Assistant) on the client container

1. In the **Web** container workspace -> **Preview**. Enter URL `https://capellauae.com` (and repeat on `http://localhost:3000` for dev with `META_TEST_EVENT_CODE=TEST66310`).
2. Tag Assistant opens. For each dataLayer event, in the **Tags** tab confirm:
   - the matching Custom Event trigger fired (CE - <event>);
   - the GA4 Event tag fired (status: "Fired", not "Not Fired");
   - the GA4 Event tag's fired data shows `include_ecommerce = true` and the resolved `value`, `currency=AED`, `items`, and `transaction_id` (on purchase);
   - the `{{event_id}}` variable resolves to a non-empty value on `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`, `generate_lead`, `sign_up` (and is undefined/blank on the others — expected).
3. In the **Variables** / **Data Layer** tab, open an `add_to_cart` (or `purchase`) event and confirm the pushed object matches `gtm.ts` (event, event_id, ecommerce with AED currency, and `fbp`/`fbc` keys present from `gtm.ts:132`/`:215`).

### D.2 sGTM Preview (server) linked to the browser preview

1. In the **Server** container workspace -> **Preview**. A separate server preview tab opens.
2. The browser Tag Assistant and the server Preview link automatically via the `?gtm_debug=x` parameter when both containers are in preview.
3. Trigger each event on the site. In the server Preview's **Tags** tab confirm:
   - `Server Tag - GA4 MP` fires for all 13 events;
   - `Server Tag - Meta CAPI` fires for the mapped conversion events (and **does not** fire for `remove_from_cart` / `checkout_abandon`);
   - in the tag's resolved data, **`fbp_present` / `fbc_present` are true** and `{{fbp}}` / `{{fbc}}` resolve to non-empty values (EMQ-critical);
   - `{{event_id}}` resolves to `order_<orderId>` on purchase (matches the browser Pixel);
   - `action_source = website`, `client_ip_address` and `client_user_agent` non-empty.
4. If `fbp`/`fbc` are empty: the cookies are not reaching sGTM. Check the cookie domain (`_fbp` should be on `.capellauae.com`) and that the GA4 config tag's server container URL is exactly `https://metrics.capellauae.com`.

### D.3 GA4 DebugView

1. GA4 -> **Admin** -> **DebugView** (or open `https://capellauae.com?gtm_debug=x`; both surface the debug stream for property `G-V0F7MTSEFB`).
2. Walk the funnel and confirm all 14 events appear with:
   - `currency = AED` on every monetized event;
   - correct `value` (line totals on `add_to_cart`, full paid total on `purchase`);
   - `transaction_id` present on `purchase` and equals the order id;
   - `items` array populated for product events;
   - no duplicate `page_view` on the first client-side navigation.

### D.4 Meta Events Manager -> Test Events

1. Meta Events Manager -> select Pixel `961780093407076` -> **Test Events**.
2. Enter test code `TEST66310` (dev environment only).
3. Walk the funnel. For each event that carries `event_id` (`add_to_cart`, `begin_checkout`, `purchase`, `generate_lead`, `sign_up`), confirm:
   - one **Browser** row and one **Server** row arrive for the same `event_id`;
   - the **Deduplicated** column collapses them to **1** (dedup working);
   - Browser and Server counts are roughly equal per event type (a wildly lopsided ratio means one side is dropping events).
4. For `purchase`, confirm the server row carries `fbp`/`fbc` + hashed `em`/`ph` and the dedup id is exactly `order_<orderId>`.
5. Remove `TEST66310` from the production container before any prod traffic.

---

## Part E — Final Checklist

Mirrors the validation section of `GTM_SGTM_MIGRATION_PLAN.md`, expanded with the exact tag/trigger/variable names created above.

### Client (Web) container `GTM-NPQT2ZKL`
- [ ] `GA4 Configuration - Capella UAE` created; Measurement ID `G-V0F7MTSEFB`; Server Container URL `https://metrics.capellauae.com`; trigger = Consent Initialization - All Pages.
- [ ] `Meta Pixel - Init + PageView` custom HTML created; Pixel `961780093407076`; `autoConfig` off; initial `PageView` fired; trigger = Consent Initialization - All Pages (paused during `parallel` run, per A.3 caution).
- [ ] 13 GA4 Event tags created (`GA4 Event - page_view` ... `GA4 Event - checkout_abandon`); each bound to config tag `GA4 Configuration - Capella UAE`; **Include Ecommerce Data** on for all except `page_view`.
- [ ] 13 Custom Event triggers created (`CE - page_view` ... `CE - checkout_abandon`), each `Equals` the dataLayer event name.
- [ ] History Change trigger is NOT used for `page_view` (no double pageview).
- [ ] Consent typing (`ad_storage` + `analytics_storage`) present on GA4 Configuration, every GA4 Event tag, and the Meta Pixel tag.
- [ ] Variable `{{event_id}}` (Data Layer Variable) created and referenced by the GA4 Event tags that carry an `event_id`.
- [ ] Workspace submitted and published (`Phase 3 - GA4 + Meta client build`).
- [ ] No Google Ads tags and no Conversion Linker anywhere in the container.

### Server container (sGTM)
- [ ] `Client - GA4 Web` created; claims only `/g/collect` and `/gtm/js`.
- [ ] `Server Tag - GA4 MP` created; Measurement ID `G-V0F7MTSEFB`; API Secret = `{{GA4_MP_API_SECRET}}`; trigger = All Events / GA4 client.
- [ ] `Server Tag - Meta CAPI` (Stape template) created; Pixel `961780093407076`; token = `META_CAPI_ACCESS_TOKEN` env var (or `{{META_CAPI_ACCESS_TOKEN}}`); event-name mapping per B.3; `action_source=website`; fires only on mapped conversion events.
- [ ] `Server Tag - Meta CAPI` `event_id` field = `{{event_id}}` (same value the browser Pixel uses).
- [ ] `Server Tag - Meta CAPI` `fbp` = `{{fbp}}`, `fbc` = `{{fbc}}` (first-party cookie variables).
- [ ] Server Container URL set to `https://metrics.capellauae.com`.
- [ ] `remove_from_cart` and `checkout_abandon` do NOT trigger the Meta CAPI tag.
- [ ] `Test Event Code` = `TEST66310` in dev only; empty in prod.

### Variables
- [ ] Client: `{{event_id}}` (Data Layer Variable).
- [ ] Server: `{{fbp}}` (First-Party Cookie `_fbp`), `{{fbc}}` (First-Party Cookie `_fbc`), `{{event_id}}` (Event Data), `{{transaction_id}}` (Event Data), `{{GA4_MP_API_SECRET}}` (Constant), `{{META_CAPI_ACCESS_TOKEN}}` (Constant).

### Provisioning / repo
- [ ] `CONTAINER_CONFIG` obtained via Admin -> Container -> Install -> Manually provision server; pasted as `SGTM_CONTAINER_CONFIG` in Coolify; sGTM logs `Container config loaded`; `https://metrics.capellauae.com/healthz` returns 200.
- [ ] Workspace exported to `sgtm/workspace-export.json` and committed; secret-bearing constants treated as sensitive.

### Verification (live)
- [ ] Tag Assistant (client): every GA4 Event tag fires; `currency=AED`, `value`, `items`, `transaction_id` correct; `{{event_id}}` resolves on dedup'd events.
- [ ] sGTM Preview: `Server Tag - GA4 MP` + `Server Tag - Meta CAPI` fire; `fbp_present`/`fbc_present` true; `event_id` non-empty; `client_ip_address`/`client_user_agent` non-empty.
- [ ] GA4 DebugView: all 14 events with `currency=AED`, correct values, `transaction_id` on purchase, no duplicate `page_view`.
- [ ] Meta Test Events (`TEST66310`): browser + server rows for the same `event_id` dedup to 1 on `add_to_cart`, `begin_checkout`, `purchase`, `generate_lead`, `sign_up`.
- [ ] No raw PII observed in dataLayer or sGTM Preview (only hashed/opaque values).
- [ ] Currency is `AED` on every event in every channel (no stray USD/non-AED).
