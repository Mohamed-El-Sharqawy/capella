export interface PaymentSession {
  paymentIntentId: string;
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

export type PaymentMethod = "ZIINA" | "TABBY" | "TAMARA" | "COD";

export interface WebhookEvent {
  event: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency_code: string;
    account_id: string;
  };
}
