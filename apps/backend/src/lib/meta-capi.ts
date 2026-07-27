import crypto from "crypto";
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeCity,
  normalizeZip,
  normalizeCountry,
} from "@ecommerce/shared-utils";

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
const API_VERSION = process.env.META_API_VERSION || "v21.0";
const IS_PROD = process.env.NODE_ENV === "production";
const MAX_ATTEMPTS = 3;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export interface CapiContext {
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  eventId?: string;
  eventSourceUrl?: string;
}

export interface CAPIEvent {
  eventName: string;
  eventTime?: number;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
  value?: number;
  currency?: string;
  orderId?: string;
  eventId?: string;
  userAgent?: string;
  ip?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
  contentIds?: string[];
  contentType?: string;
  contentName?: string;
  numItems?: number;
}

export function parseCookie(
  cookieHeader: string | null,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]).trim() : undefined;
}

export function fbcFromFbclid(
  referer: string | undefined,
): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    const fbclid = url.searchParams.get("fbclid");
    if (!fbclid) return undefined;
    return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    return undefined;
  }
}

export function extractCapiContext(request: Request): CapiContext {
  const headers = request.headers;
  const cookieHeader = headers.get("cookie");

  const forwardedFor = headers.get("x-forwarded-for");
  const clientIpAddress = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : headers.get("x-real-ip") || undefined;

  const referer = headers.get("referer") || undefined;
  const origin = headers.get("origin") || undefined;

  return {
    clientIpAddress,
    clientUserAgent: headers.get("user-agent") || undefined,
    fbp: headers.get("x-fbp") || parseCookie(cookieHeader, "_fbp") || undefined,
    fbc:
      headers.get("x-fbc") ||
      parseCookie(cookieHeader, "_fbc") ||
      fbcFromFbclid(referer) ||
      undefined,
    eventId: headers.get("x-fb-event-id") || undefined,
    eventSourceUrl: referer || origin || undefined,
  };
}

export type CapiContextRecord = {
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  eventSourceUrl?: string | null;
};

export function capiContextFromRecord(
  rec: CapiContextRecord | null | undefined,
): CapiContext | undefined {
  if (!rec || typeof rec !== "object") return undefined;
  const has = Boolean(
    rec.fbp ||
      rec.fbc ||
      rec.clientIpAddress ||
      rec.clientUserAgent ||
      rec.eventSourceUrl,
  );
  if (!has) return undefined;
  return {
    fbp: rec.fbp || undefined,
    fbc: rec.fbc || undefined,
    clientIpAddress: rec.clientIpAddress || undefined,
    clientUserAgent: rec.clientUserAgent || undefined,
    eventSourceUrl: rec.eventSourceUrl || undefined,
  };
}

export function capiContextFromOrder(order: {
  capiContext?: unknown;
} | null | undefined): CapiContext | undefined {
  if (!order || !order.capiContext) return undefined;
  return capiContextFromRecord(order.capiContext as CapiContextRecord);
}

export function capiMetadataFields(
  capiCtx?: CapiContext,
): Record<string, string> {
  if (!capiCtx) return {};
  const fields: Record<string, string> = {};
  if (capiCtx.fbp) fields.fbp = capiCtx.fbp;
  if (capiCtx.fbc) fields.fbc = capiCtx.fbc;
  if (capiCtx.clientIpAddress) fields.clientIpAddress = capiCtx.clientIpAddress;
  if (capiCtx.clientUserAgent) fields.clientUserAgent = capiCtx.clientUserAgent;
  if (capiCtx.eventSourceUrl) fields.eventSourceUrl = capiCtx.eventSourceUrl;
  return fields;
}

export async function sendMetaEvent({
  eventName,
  eventTime,
  email,
  phone,
  firstName,
  lastName,
  city,
  state,
  zipCode,
  country,
  externalId,
  value,
  currency = "AED",
  orderId,
  eventId,
  userAgent,
  ip,
  fbp,
  fbc,
  eventSourceUrl,
  contentIds,
  contentType,
  contentName,
  numItems,
}: CAPIEvent) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("META_PIXEL_ID or META_ACCESS_TOKEN not set, skipping CAPI event");
    return;
  }

  // Never leak test events into production — Meta does not drop test events.
  const useTestCode = !IS_PROD && TEST_EVENT_CODE;
  if (IS_PROD && TEST_EVENT_CODE) {
    console.warn(
      "[CAPI] META_TEST_EVENT_CODE is set in production — ignoring to avoid polluting live data"
    );
  }

  const userData: Record<string, string> = {};

  if (email) userData.em = sha256(normalizeEmail(email));
  if (phone) {
    const ph = normalizePhone(phone);
    if (ph) userData.ph = sha256(ph);
  }
  if (firstName) userData.fn = sha256(normalizeName(firstName));
  if (lastName) userData.ln = sha256(normalizeName(lastName));
  if (city) userData.ct = sha256(normalizeCity(city));
  if (state) userData.st = sha256(normalizeCountry(state));
  if (zipCode) userData.zp = sha256(normalizeZip(zipCode));
  if (country) userData.country = sha256(normalizeCountry(country));
  if (externalId) userData.external_id = sha256((externalId || "").trim());
  if (ip) userData.client_ip_address = ip;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  if (Object.keys(userData).length === 0) {
    console.warn(`[CAPI] Skipping ${eventName}: no customer data provided`);
    return;
  }

  const hasMatchableKey =
    userData.em ||
    userData.ph ||
    userData.fbp ||
    userData.fbc ||
    userData.external_id ||
    (userData.client_ip_address && userData.client_user_agent);

  if (!hasMatchableKey) {
    console.warn(`[CAPI] Skipping ${eventName}: insufficient customer data for matching`);
    return;
  }

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: eventTime ?? Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: userData,
    custom_data: {
      value,
      currency,
      order_id: orderId,
      ...(contentIds && { content_ids: contentIds }),
      ...(contentType && { content_type: contentType }),
      ...(contentName && { content_name: contentName }),
      ...(numItems != null && { num_items: numItems }),
    },
  };

  if (eventId) event.event_id = eventId;
  if (eventSourceUrl) event.event_source_url = eventSourceUrl;

  const payload: Record<string, unknown> = { data: [event] };
  if (useTestCode) {
    payload.test_event_code = TEST_EVENT_CODE;
  }

  if (!IS_PROD) {
    console.log(`[CAPI] Sending: ${eventName}`, {
      eventId,
      email: email ? "***" : undefined,
      phone: phone ? "***" : undefined,
      value,
      currency,
      orderId,
      testMode: !!useTestCode,
    });
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (!IS_PROD) {
          console.log(
            `Meta CAPI event sent: ${eventName} (${eventId})${useTestCode ? " [TEST]" : ""}`
          );
        }
        return;
      }

      // 4xx (except 429 rate limit) are not retryable — bad payload, bad token, etc.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        console.error("Meta CAPI error:", await res.text());
        return;
      }

      const errorBody = await res.text();
      if (attempt === MAX_ATTEMPTS) {
        console.error(
          `[CAPI] ${eventName} permanently failed (${res.status}) after ${attempt} attempts:`,
          errorBody
        );
        return;
      }
      console.warn(
        `[CAPI] ${eventName} attempt ${attempt} failed (${res.status}), retrying...`
      );
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        console.error(`[CAPI] ${eventName} permanently failed after ${attempt} network attempts:`, err);
        return;
      }
      console.warn(`[CAPI] ${eventName} attempt ${attempt} network error, retrying...`, err);
    }

    // Exponential backoff: 500ms, 1s, 2s...
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
  }
}
