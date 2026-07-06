const TAMARA_API_BASE =
  process.env.TAMARA_API_BASE || "https://api.tamara.co";

interface Money {
  amount: string;
  currency: string;
}

interface AddressInput {
  first_name: string;
  last_name: string;
  line1: string;
  city: string;
  country: string;
  region?: string;
  postal_code?: string;
  phone_number?: string;
}

interface OrderItemInput {
  reference_id: string;
  name: string;
  quantity: number;
  unit_price: Money;
  total_amount: Money;
  type?: string;
  image_url?: string;
  categories?: string[][];
}

interface CreateCheckoutParams {
  order_reference_id: string;
  total_amount: Money;
  shipping_amount: Money;
  discount_amount: Money;
  description?: string;
  country_code: string;
  payment_type: string;
  platform: string;
  locale: string;
  items: OrderItemInput[];
  consumer: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  billing_address: AddressInput;
  shipping_address: AddressInput;
  success_url: string;
  cancel_url: string;
  failure_url: string;
  notification_to: string;
}

interface CreateCheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  payment_type: string;
  order_reference_id: string;
  status?: string;
}

interface OrderStatusResponse {
  order_reference_id?: string;
  order_number?: string;
  status:
    | "pending"
    | "approved"
    | "authorised"
    | "partially_captured"
    | "fully_captured"
    | "captured"
    | "cancelled"
    | "expired"
    | "refunded"
    | "rejected"
    | string;
  payment_type?: string;
  total_amount?: Money;
  order?: {
    total_amount?: Money;
    items?: Array<{ name?: string; quantity?: number; unit_price?: Money }>;
  };
}

interface CaptureResponse {
  capture_id: string;
  status?: string;
}

interface RefundResponse {
  refund_id: string;
  status?: string;
}

interface WebhookPayload {
  order_reference_id: string;
  order_number?: string;
  status?: string;
  payment_type?: string;
  platform?: string;
  total_amount?: Money;
}

function getApiKey(): string {
  const key = process.env.TAMARA_API_KEY;
  if (!key || key === "your_tamara_merchant_key") {
    throw new Error("Tamara is not configured. Set TAMARA_API_KEY in .env");
  }
  return key;
}

async function tamaraRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${TAMARA_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
    console.log(`[Tamara] -> ${method} ${url}\n` + JSON.stringify(body, null, 2));
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    console.error(
      `[Tamara] ${method} ${path} -> ${response.status}:`,
      text
    );
    // Surface Tamara's raw response so opaque 500s are debuggable from the
    // client instead of just the server console.
    const trimmed = text.length > 800 ? text.slice(0, 800) + "…" : text;
    throw new Error(`Tamara API error (${response.status}): ${trimmed}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return {} as T;
}

export const TamaraClient = {
  async createCheckout(
    params: CreateCheckoutParams
  ): Promise<CreateCheckoutResponse> {
    return tamaraRequest<CreateCheckoutResponse>("POST", "/checkout", params);
  },

  async getOrderStatus(
    orderReferenceId: string
  ): Promise<OrderStatusResponse> {
    return tamaraRequest<OrderStatusResponse>(
      "GET",
      `/orders/${encodeURIComponent(orderReferenceId)}`
    );
  },

  async capturePayment(
    orderReferenceId: string,
    totalAmount: Money
  ): Promise<CaptureResponse> {
    return tamaraRequest<CaptureResponse>("POST", "/payments/capture", {
      order_id: orderReferenceId,
      total_amount: totalAmount,
    });
  },

  async refundPayment(
    orderReferenceId: string,
    totalAmount: Money
  ): Promise<RefundResponse> {
    return tamaraRequest<RefundResponse>("POST", "/payments/refund", {
      order_id: orderReferenceId,
      total_amount: totalAmount,
    });
  },

  parseWebhookPayload(payload: string): WebhookPayload {
    return JSON.parse(payload) as WebhookPayload;
  },
};

function money(amount: number, currency: string): Money {
  return {
    amount: (Math.round(amount * 100) / 100).toFixed(2),
    currency,
  };
}

export { money };
export type {
  Money,
  CreateCheckoutParams,
  CreateCheckoutResponse,
  OrderStatusResponse,
  WebhookPayload as TamaraWebhookPayload,
};
