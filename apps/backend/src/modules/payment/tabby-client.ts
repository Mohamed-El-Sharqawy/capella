import crypto from "crypto";

// Base URL is the same for test & live — test vs live is determined by the key
// (sk_test_... routes to sandbox, sk_... routes to production).
const TABBY_API_BASE = process.env.TABBY_API_BASE || "https://api.tabby.ai";

// https://docs.tabby.ai/pay-in-4-custom-integration/webhooks (Tabby server IPs)
const TABBY_WEBHOOK_IPS = [
  "34.166.36.90",
  "34.166.35.211",
  "34.166.34.222",
  "34.166.37.207",
  "34.93.76.191",
  "34.166.128.182",
  "34.166.170.3",
  "34.166.249.7",
];

interface AddressInput {
  city: string;
  address: string;
  zip: string;
}

interface OrderItemInput {
  reference_id: string;
  title: string;
  quantity: number;
  unit_price: string;
  category?: string;
  image_url?: string;
  product_url?: string;
  brand?: string;
}

interface CreateCheckoutParams {
  amount: string;
  currency: string;
  description?: string;
  merchantCode: string;
  lang: "en" | "ar";
  buyer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping_address: AddressInput;
  order_reference_id: string;
  items: OrderItemInput[];
  shipping_amount?: string;
  discount_amount?: string;
  buyer_history?: {
    registered_since: string;
    loyalty_level: number;
  };
  merchant_urls: {
    success: string;
    cancel: string;
    failure: string;
  };
}

interface CreateCheckoutResponse {
  id: string;
  status: "created" | "rejected" | "expired" | "approved";
  payment: {
    id: string;
    status: string;
    amount: string;
    currency: string;
    is_test?: boolean;
  };
  configuration?: {
    available_products?: {
      installments?: Array<{ web_url?: string | null }>;
    } | null;
  };
}

// https://docs.tabby.ai/pay-in-4-custom-integration/checkout-flow#background-pre-scoring-check
// Same POST /api/v2/checkout endpoint, minimal payload. status "created" =>
// eligible; "rejected" => ineligible, reason at configuration.products.installments.rejection_reason
interface EligibilityResponse {
  status: "created" | "rejected" | "expired";
  configuration?: {
    products?: {
      installments?: { rejection_reason?: string } | null;
    } | null;
    available_products?: {
      installments?: Array<{ web_url?: string | null }>;
    } | null;
  };
}

interface RetrievePaymentResponse {
  id: string;
  status: "CREATED" | "AUTHORIZED" | "CLOSED" | "REJECTED" | "EXPIRED";
  amount: string;
  currency: string;
  is_test?: boolean;
}

interface CaptureResponse {
  id: string;
  amount: string;
  created_at: string;
  reference_id?: string;
}

interface RefundResponse {
  id: string;
  amount: string;
  created_at: string;
  reference_id?: string;
}

interface WebhookPayload {
  id: string;
  created_at?: string;
  status: string;
  amount: string;
  currency: string;
  is_test?: boolean;
  order?: { reference_id?: string };
}

interface WebhookRegistrationResponse {
  id: string;
  url: string;
  is_test?: boolean;
}

interface RegisterWebhookParams {
  url: string;
  merchantCode: string;
  /** Optional shared secret; if set, Tabby sends it back in the auth header. */
  secret?: string;
}

function getSecretKey(): string {
  const key = process.env.TABBY_SECRET_KEY;
  if (!key || key === "your_tabby_secret_key") {
    throw new Error("Tabby is not configured. Set TABBY_SECRET_KEY in .env");
  }
  return key;
}

async function tabbyRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const url = `${TABBY_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };

  const options: RequestInit = { method, headers };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    let errorMessage: string;
    try {
      const parsed = JSON.parse(text);
      errorMessage = parsed.error || parsed.errorType || parsed.message || text;
    } catch {
      errorMessage = text;
    }
    throw new Error(`Tabby API error (${response.status}): ${errorMessage}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return {} as T;
}

export const TabbyClient = {
  async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CreateCheckoutResponse> {
    return tabbyRequest<CreateCheckoutResponse>("POST", "/api/v2/checkout", {
      payment: {
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        buyer: params.buyer,
        shipping_address: params.shipping_address,
        order: {
          reference_id: params.order_reference_id,
          items: params.items,
          shipping_amount: params.shipping_amount || "0.00",
          discount_amount: params.discount_amount || "0.00",
          tax_amount: "0.00",
        },
        buyer_history: params.buyer_history || {
          registered_since: new Date().toISOString(),
          loyalty_level: 0,
        },
      },
      lang: params.lang,
      merchant_code: params.merchantCode,
      merchant_urls: params.merchant_urls,
    });
  },

  async retrievePayment(paymentId: string): Promise<RetrievePaymentResponse> {
    return tabbyRequest<RetrievePaymentResponse>(
      "GET",
      `/api/v2/payments/${paymentId}`
    );
  },

  // Background pre-scoring (eligibility) check. Minimal payload — amount,
  // currency, buyer contact, merchant_code — per the docs. Returns status +
  // rejection_reason. The same endpoint is reused for full session creation,
  // but with a complete payload, at "Place order" time.
  async checkEligibility(params: {
    amount: string;
    currency: string;
    buyer: { email: string; phone: string };
    merchantCode: string;
  }): Promise<EligibilityResponse> {
    return tabbyRequest<EligibilityResponse>("POST", "/api/v2/checkout", {
      payment: {
        amount: params.amount,
        currency: params.currency,
        buyer: params.buyer,
      },
      merchant_code: params.merchantCode,
    });
  },

  async capturePayment(
    paymentId: string,
    amount: string,
    referenceId: string
  ): Promise<CaptureResponse> {
    return tabbyRequest<CaptureResponse>(
      "POST",
      `/api/v2/payments/${paymentId}/captures`,
      { amount, reference_id: referenceId }
    );
  },

  async refundPayment(
    paymentId: string,
    amount: string,
    reason: string,
    referenceId: string
  ): Promise<RefundResponse> {
    return tabbyRequest<RefundResponse>(
      "POST",
      `/api/v2/payments/${paymentId}/refunds`,
      { amount, reason, reference_id: referenceId }
    );
  },

  // https://docs.tabby.ai/api-reference/webhooks/register-a-webhook
  // POST /api/v1/webhooks — registered per merchant_code + key pair. The
  // environment (test/live) is determined by the secret key used to auth.
  async registerWebhook(
    params: RegisterWebhookParams
  ): Promise<WebhookRegistrationResponse> {
    const body: Record<string, unknown> = { url: params.url };
    if (params.secret) {
      // Tabby echoes this header+value back on every webhook so we can verify
      // authenticity. We read it as `x-tabby-auth` in the webhook handler.
      body.header = { title: "x-tabby-auth", value: params.secret };
    }
    return tabbyRequest<WebhookRegistrationResponse>(
      "POST",
      "/api/v1/webhooks",
      body,
      { "X-Merchant-Code": params.merchantCode }
    );
  },

  /**
   * Verify the webhook auth header. Tabby sends the configured secret value
   * verbatim in the header (it does NOT HMAC the body), so we compare the raw
   * header value against the configured secret in constant time. When no
   * secret is configured, authenticity is still guaranteed by the server-side
   * GET (retrievePayment) re-fetch performed in the handler.
   */
  verifyWebhookSignature(
    _payload: string,
    signature: string | undefined,
    secret: string | undefined
  ): boolean {
    if (!secret) return true;
    if (!signature) return false;
    const a = Buffer.from(signature);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  isAllowedIp(ip: string): boolean {
    return TABBY_WEBHOOK_IPS.includes(ip);
  },

  parseWebhookPayload(payload: string): WebhookPayload {
    return JSON.parse(payload) as WebhookPayload;
  },
};

export type {
  CreateCheckoutParams,
  CreateCheckoutResponse,
  EligibilityResponse,
  RetrievePaymentResponse,
  RegisterWebhookParams,
  WebhookPayload as TabbyWebhookPayload,
};
