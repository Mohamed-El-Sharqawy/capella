import { prisma } from "./prisma";
import type { Prisma } from "../../generated/prisma/client";

/**
 * Stock / availability helpers shared by cart, COD orders and online checkout.
 *
 * A variant is purchasable only when the variant AND its product are active
 * and it has stock. "Available" below is the quantity that can actually be
 * bought right now (0 for inactive variants/products).
 */

export interface StockLine {
  variantId: string;
  quantity: number;
}

export interface StockIssue {
  variantId: string;
  requested: number;
  available: number;
}

export const OUT_OF_STOCK_CODE = "OUT_OF_STOCK";

export class OutOfStockError extends Error {
  readonly code = OUT_OF_STOCK_CODE;
  constructor(public readonly items: StockIssue[], message = "Some items are out of stock") {
    super(message);
    this.name = "OutOfStockError";
  }
}

/** JSON body for an out-of-stock response (HTTP 409). */
export function outOfStockBody(err: OutOfStockError) {
  return {
    success: false as const,
    error: err.message,
    code: OUT_OF_STOCK_CODE,
    items: err.items,
  };
}

type VariantForAvailability = {
  id: string;
  stock: number;
  isActive: boolean;
  product: { isActive: boolean };
};

export function availableQuantity(variant: VariantForAvailability | null | undefined): number {
  if (!variant || !variant.isActive || !variant.product.isActive) return 0;
  return Math.max(0, variant.stock);
}

/** Merge duplicate variant lines so stock is checked against the total requested. */
function mergeLines(lines: StockLine[]): StockLine[] {
  const merged = new Map<string, number>();
  for (const line of lines) {
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + line.quantity);
  }
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}

/** Current purchasable quantity for each requested variant (missing ids -> 0). */
export async function getAvailability(variantIds: string[]) {
  const ids = [...new Set(variantIds)];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      stock: true,
      isActive: true,
      price: true,
      product: { select: { isActive: true } },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  return ids.map((variantId) => {
    const variant = byId.get(variantId);
    return {
      variantId,
      available: availableQuantity(variant),
      price: variant?.price ?? null,
    };
  });
}

/**
 * Throws OutOfStockError listing every line that cannot be fulfilled.
 * Use for early validation before creating an order / payment session.
 */
export function assertInStock(lines: StockLine[], variants: VariantForAvailability[]) {
  const byId = new Map(variants.map((v) => [v.id, v]));
  const issues: StockIssue[] = [];
  for (const line of mergeLines(lines)) {
    const available = availableQuantity(byId.get(line.variantId));
    if (available < line.quantity) {
      issues.push({ variantId: line.variantId, requested: line.quantity, available });
    }
  }
  if (issues.length > 0) throw new OutOfStockError(issues);
}

/**
 * Atomically decrement stock inside a transaction. Each decrement only
 * succeeds if enough stock remains at that instant (conditional UPDATE), so
 * two customers racing for the last unit can never both get it. Throws
 * OutOfStockError (rolling back the whole transaction) on any shortfall.
 */
export async function decrementStock(
  tx: Prisma.TransactionClient,
  lines: StockLine[],
  { requireActive = true }: { requireActive?: boolean } = {},
) {
  const issues: StockIssue[] = [];
  for (const line of mergeLines(lines)) {
    const result = await tx.productVariant.updateMany({
      where: {
        id: line.variantId,
        ...(requireActive ? { isActive: true, product: { isActive: true } } : {}),
        stock: { gte: line.quantity },
      },
      data: { stock: { decrement: line.quantity } },
    });
    if (result.count === 0) {
      const variant = await tx.productVariant.findUnique({
        where: { id: line.variantId },
        select: { id: true, stock: true, isActive: true, product: { select: { isActive: true } } },
      });
      issues.push({
        variantId: line.variantId,
        requested: line.quantity,
        available: requireActive ? availableQuantity(variant) : Math.max(0, variant?.stock ?? 0),
      });
    }
  }
  if (issues.length > 0) throw new OutOfStockError(issues);
}

/** Add units back to stock (used when an order's hold is released). */
export async function incrementStock(tx: Prisma.TransactionClient, lines: StockLine[]) {
  for (const line of mergeLines(lines)) {
    await tx.productVariant.updateMany({
      where: { id: line.variantId },
      data: { stock: { increment: line.quantity } },
    });
  }
}

type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

/**
 * Return an order's held units to stock exactly once.
 *
 * Claims the hold with a conditional update (stockReserved true -> false,
 * optionally only from `onlyIfStatus`), then increments stock in the same
 * transaction. Concurrent callers (webhook, expiry sweep, customer return,
 * admin) can't double-restock: only one wins the claim. Returns whether this
 * call released the hold.
 */
export async function releaseOrderStock(
  orderId: string,
  opts: { onlyIfStatus?: OrderStatusValue; nextStatus?: OrderStatusValue } = {},
  client: Prisma.TransactionClient | null = null,
): Promise<boolean> {
  const run = async (tx: Prisma.TransactionClient) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        stockReserved: true,
        ...(opts.onlyIfStatus ? { status: opts.onlyIfStatus } : {}),
      },
      data: {
        stockReserved: false,
        ...(opts.nextStatus ? { status: opts.nextStatus } : {}),
      },
    });
    if (claimed.count === 0) return false;
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });
    await incrementStock(tx, items);
    return true;
  };
  return client ? run(client) : prisma.$transaction(run);
}
