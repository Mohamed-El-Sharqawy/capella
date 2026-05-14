import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = "v19.0";

function hash(value: string) {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export interface CAPIEvent {
  eventName: string;
  eventTime?: number;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  orderId?: string;
  eventId?: string;
  userAgent?: string;
  ip?: string;
  fbp?: string;
  fbc?: string;
}

export async function sendMetaEvent({
  eventName,
  eventTime,
  email,
  phone,
  firstName,
  lastName,
  value,
  currency = "AED",
  orderId,
  eventId,
  userAgent,
  ip,
  fbp,
  fbc,
}: CAPIEvent) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("META_PIXEL_ID or META_ACCESS_TOKEN not set, skipping CAPI event");
    return;
  }

  const userData: Record<string, string> = {};

  if (email) userData.em = hash(email);
  if (phone) userData.ph = hash(phone);
  if (firstName) userData.fn = hash(firstName);
  if (lastName) userData.ln = hash(lastName);
  if (ip) userData.client_ip_address = ip;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime ?? Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: userData,
        custom_data: {
          value,
          currency,
          order_id: orderId,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      console.error("Meta CAPI error:", await res.text());
    } else {
      console.log(`Meta CAPI event sent: ${eventName} (${eventId})`);
    }
  } catch (err) {
    console.error("Meta CAPI fetch failed:", err);
  }
}
