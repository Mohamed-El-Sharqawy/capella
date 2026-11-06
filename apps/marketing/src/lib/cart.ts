import type { ProductVariant } from "@ecommerce/shared-types";
import { getAvailableStock } from "./stock";

export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productNameEn: string;
  productNameAr: string;
  variantNameEn: string;
  variantNameAr: string;
  // Carried so Meta content_ids can be formatted as `cap-<sku>` (catalog parity).
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  quantity: number;
  imageUrl?: string;
  colorHex?: string;
  colorNameEn?: string;
  colorNameAr?: string;
  sizeNameEn?: string;
  sizeNameAr?: string;
  collectionId?: string;
  collectionSlug?: string;
  /**
   * Last known purchasable quantity for this variant (0 = sold out).
   * Set when added and refreshed from the backend (see refreshStock in
   * cart-context). Undefined for items saved before stock tracking existed.
   */
  stock?: number;
}

/** An item that can't be checked out as-is (sold out / fewer left than requested). */
export function isCartItemUnavailable(item: CartItem): boolean {
  return item.stock !== undefined && item.quantity > item.stock;
}

/** How many more units of this item could still be added. */
export function remainingStock(item: Pick<CartItem, "stock" | "quantity"> | null | undefined, stock: number): number {
  return Math.max(0, stock - (item?.quantity ?? 0));
}

const CART_STORAGE_KEY = "guest_cart";

export function getGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.error("Failed to save cart to localStorage");
  }
}

/**
 * Add an item, never exceeding its known stock. Returns the updated cart and
 * how many units were actually added (0 when sold out / already at the limit).
 */
export function addToGuestCart(item: CartItem): { cart: CartItem[]; added: number } {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex((i) => i.variantId === item.variantId);
  const existing = existingIndex >= 0 ? cart[existingIndex] : null;
  const current = existing?.quantity ?? 0;
  const limit = item.stock ?? Infinity;
  const nextQuantity = Math.min(current + item.quantity, limit);
  const added = Math.max(0, nextQuantity - current);

  if (existing) {
    existing.quantity = Math.max(current, nextQuantity);
    if (item.stock !== undefined) existing.stock = item.stock;
  } else if (added > 0) {
    cart.push({ ...item, quantity: added });
  }

  saveGuestCart(cart);
  return { cart, added };
}

export function updateGuestCartQuantity(
  variantId: string,
  quantity: number
): CartItem[] {
  const cart = getGuestCart();
  const index = cart.findIndex((i) => i.variantId === variantId);

  if (index >= 0) {
    const item = cart[index];
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else if (item.stock !== undefined && quantity > item.quantity && quantity > item.stock) {
      // Increasing beyond available stock is not allowed; leave as is.
      return cart;
    } else {
      item.quantity = quantity;
    }
  }

  saveGuestCart(cart);
  return cart;
}

export function removeFromGuestCart(variantId: string): CartItem[] {
  const cart = getGuestCart().filter((i) => i.variantId !== variantId);
  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

/**
 * Apply live availability to the cart: store each item's current stock and
 * lower quantities that exceed what's left. Sold-out items (stock 0) are kept
 * but flagged, so the customer sees what happened and removes them.
 */
export function applyAvailability(
  cart: CartItem[],
  availability: Map<string, number>,
): { cart: CartItem[]; reduced: CartItem[]; soldOut: CartItem[] } {
  const reduced: CartItem[] = [];
  const soldOut: CartItem[] = [];
  const next = cart.map((item) => {
    const stock = availability.get(item.variantId) ?? 0;
    if (stock <= 0) {
      soldOut.push(item);
      return { ...item, stock: 0 };
    }
    if (item.quantity > stock) {
      const updated = { ...item, quantity: stock, stock };
      reduced.push(updated);
      return updated;
    }
    return { ...item, stock };
  });
  return { cart: next, reduced, soldOut };
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function createCartItemFromVariant(
  variant: ProductVariant,
  product: { id: string; slug: string; nameEn: string; nameAr: string; collections?: { id: string; slug: string }[] },
  quantity: number = 1
): CartItem {
  const primaryCollection = product.collections?.[0];
  return {
    variantId: variant.id,
    productId: product.id,
    productSlug: product.slug,
    productNameEn: product.nameEn,
    productNameAr: product.nameAr,
    variantNameEn: variant.nameEn,
    variantNameAr: variant.nameAr,
    sku: variant.sku,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantity,
    imageUrl: variant.images?.[0]?.url,
    colorHex: variant.color?.hex,
    colorNameEn: variant.color?.nameEn,
    colorNameAr: variant.color?.nameAr,
    sizeNameEn: variant.size?.nameEn,
    sizeNameAr: variant.size?.nameAr,
    collectionId: primaryCollection?.id,
    collectionSlug: primaryCollection?.slug,
    stock: getAvailableStock(variant),
  };
}
