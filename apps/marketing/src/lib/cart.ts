import type { ProductVariant } from "@ecommerce/shared-types";

export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productNameEn: string;
  productNameAr: string;
  variantNameEn: string;
  variantNameAr: string;
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

export function addToGuestCart(item: CartItem): CartItem[] {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex((i) => i.variantId === item.variantId);

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartQuantity(
  variantId: string,
  quantity: number
): CartItem[] {
  const cart = getGuestCart();
  const index = cart.findIndex((i) => i.variantId === variantId);

  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
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

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function createCartItemFromVariant(
  variant: ProductVariant,
  product: { id: string; slug: string; nameEn: string; nameAr: string; collectionId?: string | null; collection?: { slug: string } | null },
  quantity: number = 1
): CartItem {
  return {
    variantId: variant.id,
    productId: product.id,
    productSlug: product.slug,
    productNameEn: product.nameEn,
    productNameAr: product.nameAr,
    variantNameEn: variant.nameEn,
    variantNameAr: variant.nameAr,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantity,
    imageUrl: variant.images?.[0]?.url,
    colorHex: variant.color?.hex,
    colorNameEn: variant.color?.nameEn,
    colorNameAr: variant.color?.nameAr,
    sizeNameEn: variant.size?.nameEn,
    sizeNameAr: variant.size?.nameAr,
    collectionId: product.collectionId ?? undefined,
    collectionSlug: product.collection?.slug,
  };
}
