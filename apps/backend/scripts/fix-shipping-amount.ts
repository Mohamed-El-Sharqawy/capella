/**
 * One-shot backfill: populate Order.shippingAmount and repair orders that were
 * incorrectly charged shipping because the deployed backend was running a stale
 * FREE_SHIPPING_THRESHOLD (1000 instead of 500).
 *
 * Background:
 *   - shared-utils source was lowered from 1000 → 500 in commit 38b44f1
 *     (Jul 17 2026 ~05:34), but the backend dist bundle and CMS dist bundle
 *     were not rebuilt at the same time, so orders placed in the window
 *     [source change .. now] were charged 25 AED shipping for subtotals in
 *     [500, 1000) that should have shipped free.
 *   - The affected customers were already refunded 25 AED through the payment
 *     provider, so we adjust the stored `total` to match what the customer
 *     ended up paying.
 *
 * What this script does, per order:
 *   1. Recomputes itemsSum and discountAmount from the stored rows.
 *   2. Computes expectedShipping = getShippingCost(itemsSum) with the CURRENT
 *      threshold (500).
 *   3. Computes impliedShipping = storedTotal - itemsSum + discountAmount
 *      (the shipping that was actually applied at creation time).
 *   4. Categorizes and acts:
 *      - HEALTHY    implied == expected → set shippingAmount = expected.
 *      - AFFECTED   implied == 25 AND expected == 0 AND createdAt is on or
 *                   after POLICY_CHANGE_DATE (Jul 17 2026, when the threshold
 *                   was lowered from 1000 → 500): refund already issued, so
 *                   set shippingAmount = 0 and total = itemsSum - discount.
 *                   Pre-POLICY_CHANGE_DATE orders that match the same
 *                   implied==25 pattern are intentionally LEFT ALONE — they
 *                   were correctly charged under the 1000-threshold policy
 *                   that was in effect at the time.
 *      - OTHER      neither pattern matches → flag for manual review, no write.
 *      - LEGACY     implied == 25 AND expected == 0 AND createdAt is before
 *                   POLICY_CHANGE_DATE → not modified. (Reported for
 *                   transparency but skipped.)
 *
 * Idempotent: safe to re-run. Always writes `shippingAmount` for HEALTHY rows
 * (first run populates the new column), and is a no-op on subsequent runs.
 *
 * Usage (from repo root):
 *   pnpm migrate:shipping                                 # dry-run everything
 *   pnpm migrate:shipping -- --apply                      # write everything
 *   pnpm migrate:shipping -- --order-id=cm...             # dry-run one order
 *   pnpm migrate:shipping -- --order-id=cm... --apply     # repair one order
 *
 * The --order-id flag bypasses the post-policy-change date guard so a legacy
 * order that was mis-charged under a previous threshold can still be repaired
 * individually, without weakening the guard for the bulk run.
 *
 * ⚠️ Take a `pg_dump` first.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
  getShippingCost,
} from "@ecommerce/shared-utils";

// The 500-AED free-shipping threshold was introduced in commit 38b44f1
// (Jul 17 2026 ~05:34 +0300). Orders placed on or after this date that were
// charged 25 AED shipping for a 500-1000 subtotal are the actual bug victims;
// the same pattern before this date was correct under the old 1000 threshold.
const POLICY_CHANGE_DATE = new Date("2026-07-17T00:00:00Z");

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};
const log = (msg: string) => console.log(msg);
const money = (n: number) => n.toFixed(2);

const apply = process.argv.includes("--apply");

// Optional explicit order id (e.g. --order-id=cm...). When set, the script
// scopes to that single order AND treats it as AFFECTED regardless of date —
// so legacy orders that were mis-charged under a previous policy can still be
// repaired without weakening the date guard for the bulk run. Still refuses
// to touch orders whose implied shipping isn't exactly the flat SHIPPING_COST
// (i.e. genuine no-shipping or custom cases need manual review).
const orderIdArg = (() => {
  const flag = process.argv.find((a) => a.startsWith("--order-id="));
  return flag ? flag.slice("--order-id=".length) : undefined;
})();

interface Plan {
  id: string;
  createdAt: Date;
  itemsSum: number;
  discount: number;
  storedTotal: number;
  impliedShipping: number;
  expectedShipping: number;
  action: "HEALTHY" | "AFFECTED" | "LEGACY" | "OTHER";
  newShipping: number;
  newTotal: number | null; // null = don't touch total
  paymentMethod: string | null;
}

async function main() {
  log(
    `${c.bright}shipping backfill${c.reset} ${c.dim}(threshold=${FREE_SHIPPING_THRESHOLD}, flat=${SHIPPING_COST})${c.reset}`
  );
  log(
    `${c.yellow}mode: ${apply ? "APPLY (writes)" : "DRY-RUN (no writes)"}${c.reset}` +
      (orderIdArg ? `${c.dim}  order=${orderIdArg}${c.reset}` : "") +
      "\n"
  );

  const orders = await prisma.order.findMany({
    where: orderIdArg ? { id: orderIdArg } : undefined,
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  if (orderIdArg && orders.length === 0) {
    log(`${c.red}order ${orderIdArg} not found${c.reset}`);
    return;
  }

  log(`scanned ${orders.length} orders\n`);

  const plans: Plan[] = orders.map((o) => {
    const itemsSum = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = o.discountAmount ?? 0;
    const storedTotal = o.total;
    const impliedShipping = Math.round((storedTotal - itemsSum + discount) * 100) / 100;
    const expectedShipping = getShippingCost(itemsSum);

    let action: Plan["action"] = "OTHER";
    let newShipping = expectedShipping;
    let newTotal: number | null = null;

    // Explicit --order-id override: skip the date guard so a legacy order that
    // was mis-charged under a previous policy can still be repaired. Guard
    // against accidental misuse by still requiring the implied shipping to
    // equal the flat SHIPPING_COST (i.e. the row really was charged the flat
    // fee) — anything else falls through to OTHER for manual review.
    const forceAffected =
      !!orderIdArg &&
      Math.abs(impliedShipping - SHIPPING_COST) < 0.01;

    if (Math.abs(impliedShipping - expectedShipping) < 0.01) {
      action = "HEALTHY";
      newShipping = expectedShipping;
      newTotal = null; // already correct
    } else if (
      (forceAffected || o.createdAt >= POLICY_CHANGE_DATE) &&
      Math.abs(impliedShipping - SHIPPING_COST) < 0.01 &&
      expectedShipping === 0
    ) {
      // Was charged flat shipping that should have been free under the current
      // 500 threshold. Bulk mode only treats post-policy-change orders this
      // way; the date guard is bypassed when the script was invoked with an
      // explicit --order-id (and the implied-shipping shape still matches).
      action = "AFFECTED";
      newShipping = 0;
      newTotal = Math.round((itemsSum - discount) * 100) / 100;
    } else if (
      !forceAffected &&
      Math.abs(impliedShipping - SHIPPING_COST) < 0.01 &&
      expectedShipping === 0
    ) {
      // Pre-policy-change order, correctly charged under the old 1000
      // threshold. Leave the total alone.
      action = "LEGACY";
      newShipping = SHIPPING_COST;
      newTotal = null;
    } else {
      action = "OTHER";
      newShipping = impliedShipping; // preserve whatever was actually charged
      newTotal = null;
    }

    return {
      id: o.id,
      createdAt: o.createdAt,
      itemsSum,
      discount,
      storedTotal,
      impliedShipping,
      expectedShipping,
      action,
      newShipping,
      newTotal,
      paymentMethod: o.paymentMethod,
    };
  });

  const counts = plans.reduce(
    (acc, p) => {
      acc[p.action]++;
      return acc;
    },
    { HEALTHY: 0, AFFECTED: 0, LEGACY: 0, OTHER: 0 } as Record<Plan["action"], number>
  );

  log(`${c.cyan}Summary${c.reset}`);
  log(`  HEALTHY  (backfill shippingAmount only):            ${counts.HEALTHY}`);
  log(`  AFFECTED (zero out shipping + fix total, post Jul17): ${c.yellow}${counts.AFFECTED}${c.reset}`);
  log(`  LEGACY   (pre-policy-change, left untouched):       ${counts.LEGACY}`);
  log(`  OTHER    (manual review, no write):                 ${counts.OTHER}`);
  log("");

  const affected = plans.filter((p) => p.action === "AFFECTED");
  if (affected.length > 0) {
    log(`${c.yellow}Affected orders${c.reset} (already refunded 25 AED externally):`);
    for (const p of affected) {
      log(
        `  ${p.id}  ${p.createdAt.toISOString().slice(0, 16).replace("T", " ")}  ` +
          `items=${money(p.itemsSum)}  discount=${money(p.discount)}  ` +
          `storedTotal=${money(p.storedTotal)}  →  newTotal=${money(p.newTotal!)}  ` +
          `(${p.paymentMethod ?? "COD"})`
      );
    }
    log("");
  }

  const legacy = plans.filter((p) => p.action === "LEGACY");
  if (legacy.length > 0) {
    log(`${c.dim}Legacy orders (pre-policy, correctly charged under old 1000 threshold, NOT modified):${c.reset}`);
    for (const p of legacy.slice(0, 5)) {
      log(
        `  ${c.dim}${p.id}  ${p.createdAt.toISOString().slice(0, 16).replace("T", " ")}  ` +
          `items=${money(p.itemsSum)}  storedTotal=${money(p.storedTotal)}${c.reset}`
      );
    }
    if (legacy.length > 5) log(`  ${c.dim}... and ${legacy.length - 5} more${c.reset}`);
    log("");
  }

  const others = plans.filter((p) => p.action === "OTHER");
  if (others.length > 0) {
    log(`${c.red}Manual review${c.reset} (implied shipping doesn't match any known pattern):`);
    for (const p of others.slice(0, 20)) {
      log(
        `  ${p.id}  items=${money(p.itemsSum)}  discount=${money(p.discount)}  ` +
          `storedTotal=${money(p.storedTotal)}  implied=${money(p.impliedShipping)}  ` +
          `expected=${money(p.expectedShipping)}`
      );
    }
    if (others.length > 20) log(`  ... and ${others.length - 20} more`);
    log("");
  }

  if (!apply) {
    log(`${c.dim}dry-run complete. Re-run with --apply to write.${c.reset}`);
    return;
  }

  // Apply: use a transaction so the backfill is atomic.
  await prisma.$transaction(async (tx) => {
    for (const p of plans) {
      if (p.action === "OTHER") continue;
      const data: { shippingAmount: number; total?: number } = {
        shippingAmount: p.newShipping,
      };
      if (p.newTotal !== null) data.total = p.newTotal;
      await tx.order.update({ where: { id: p.id }, data });
    }
  });

  const written = plans.filter((p) => p.action !== "OTHER").length;
  const totalFixed = plans.filter(
    (p) => p.action === "AFFECTED" && p.newTotal !== null
  ).length;
  log(
    `${c.green}✓ applied${c.reset}: wrote shippingAmount on ${written} order(s); ` +
      `adjusted total on ${totalFixed} affected order(s).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
