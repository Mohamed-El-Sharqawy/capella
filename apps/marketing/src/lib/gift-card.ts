/**
 * Order-level gift card option, persisted in localStorage so the choice made
 * on a product page carries to checkout (mirrors the guest cart pattern in
 * lib/cart.ts). Cleared after a successful order.
 */

export interface GiftCardState {
  enabled: boolean;
  message: string;
}

export const GIFT_MESSAGE_MAX_LENGTH = 300;

const GIFT_CARD_STORAGE_KEY = "capella_gift_card";

const DEFAULT_STATE: GiftCardState = { enabled: false, message: "" };

export function getGiftCard(): GiftCardState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem(GIFT_CARD_STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;
    const parsed = JSON.parse(stored) as Partial<GiftCardState>;
    return {
      enabled: !!parsed.enabled,
      message: typeof parsed.message === "string" ? parsed.message : "",
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveGiftCard(state: GiftCardState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      GIFT_CARD_STORAGE_KEY,
      JSON.stringify({
        enabled: state.enabled,
        message: state.message.slice(0, GIFT_MESSAGE_MAX_LENGTH),
      }),
    );
  } catch {
    console.error("Failed to save gift card to localStorage");
  }
}

export function clearGiftCard(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GIFT_CARD_STORAGE_KEY);
}

/** A gift card is ready to submit only with a non-empty message. */
export function isGiftCardIncomplete(state: GiftCardState): boolean {
  return state.enabled && !state.message.trim();
}
