/**
 * PII normalizers + shared constants for Meta Conversions API / Pixel.
 *
 * Single source of truth — imported by both `apps/backend` (CAPI, hashed server-side,
 * catalog feed builder) and `apps/marketing` (Pixel Advanced Matching, plain client-side).
 * Drift between the two causes silent Event Match Quality loss (the F6 bug) or
 * catalog/event content_id mismatch (the F8 bug).
 */

/** Store currency. Single source of truth — every Meta event must use this. */
export const CURRENCY = "AED";

/**
 * Format a variant-level content_id that byte-for-byte matches the Meta Commerce
 * catalog feed `id` column (built by `meta-catalog/service.ts`). The `cap-` prefix
 * is a stable, brand-scoped identifier. SKU wins when present; falls back to the
 * variant id so callers without sku access still produce a catalog-correlatable id.
 */
export function toContentId(variant: { sku?: string | null; id: string }): string {
  return `cap-${variant.sku || variant.id}`;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Normalize to E.164-ish digits with country code. UAE aware: 0XX -> 971XX.
export function normalizePhone(value: string): string {
  let digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("971")) return digits;
  if (digits.startsWith("0")) return "971" + digits.slice(1);
  if (digits.length === 9) return "971" + digits;
  return digits;
}

export function normalizeCity(value: string): string {
  return value.trim().toLowerCase().replace(/[\s\-.']/g, "");
}

export function normalizeZip(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]/g, "");
}

export function normalizeCountry(value: string): string {
  return value.trim().toLowerCase();
}
