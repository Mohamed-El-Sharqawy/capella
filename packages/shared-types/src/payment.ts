export interface PaymentSession {
  sessionId: string;
  url: string;
}

export interface CheckoutItem {
  variantId: string;
  quantity: number;
}

export interface CheckoutPayload {
  items: CheckoutItem[];
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
}

export type PaymentMethod = "STRIPE" | "COD";

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      payment_status: string;
      customer_details?: {
        email?: string;
      };
      metadata?: Record<string, string>;
    };
  };
}
