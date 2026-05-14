import crypto from "crypto";

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

const ZIINA_WEBHOOK_IPS = [
  "3.29.184.186",
  "3.29.190.95",
  "20.233.47.127",
  "13.202.161.181",
];

interface CreatePaymentIntentParams {
  amount: number;
  currency_code: string;
  success_url: string;
  cancel_url: string;
  failure_url?: string;
  message?: string;
  test?: boolean;
}

interface PaymentIntentResponse {
  id: string;
  account_id: string;
  amount: number;
  tip_amount: number;
  fee_amount: number;
  currency_code: string;
  created_at: string;
  status: string;
  operation_id: string;
  redirect_url: string;
  embedded_url?: string;
  success_url?: string;
  cancel_url?: string;
  latest_error?: { message: string; code: string };
}

interface CreateRefundParams {
  payment_intent_id: string;
  amount?: number;
  currency_code?: string;
  test?: boolean;
}

interface RefundResponse {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency_code: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  error?: { message: string; code: string } | null;
}

interface WebhookPayload {
  event: string;
  data: PaymentIntentResponse;
}

function getApiKey(): string {
  const key = process.env.ZIINA_API_KEY;
  if (!key || key === "ziina_test_placeholder") {
    throw new Error("Ziina is not configured. Set ZIINA_API_KEY in .env");
  }
  return key;
}

async function ziinaRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${ZIINA_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    let errorMessage: string;
    try {
      const parsed = JSON.parse(text);
      errorMessage = parsed.message || parsed.error || text;
    } catch {
      errorMessage = text;
    }
    throw new Error(
      `Ziina API error (${response.status}): ${errorMessage}`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return {} as T;
}

export const ZiinaClient = {
  async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResponse> {
    return ziinaRequest<PaymentIntentResponse>(
      "POST",
      "/payment_intent",
      params
    );
  },

  async getPaymentIntent(
    id: string
  ): Promise<PaymentIntentResponse> {
    return ziinaRequest<PaymentIntentResponse>(
      "GET",
      `/payment_intent/${id}`
    );
  },

  async createRefund(params: CreateRefundParams): Promise<RefundResponse> {
    return ziinaRequest<RefundResponse>("POST", "/refund", {
      id: crypto.randomUUID(),
      ...params,
    });
  },

  async registerWebhook(
    url: string,
    secret: string
  ): Promise<{ success: boolean; error?: string }> {
    return ziinaRequest("POST", "/webhook", { url, secret });
  },

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expected, "hex")
      );
    } catch {
      return false;
    }
  },

  isAllowedIp(ip: string): boolean {
    return ZIINA_WEBHOOK_IPS.includes(ip);
  },

  parseWebhookPayload(payload: string): WebhookPayload {
    return JSON.parse(payload) as WebhookPayload;
  },
};

export type { PaymentIntentResponse, RefundResponse, WebhookPayload };
