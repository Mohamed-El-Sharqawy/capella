/**
 * PII normalizers for Meta Conversions API / Pixel Advanced Matching.
 *
 * Single source of truth — imported by both `apps/backend` (CAPI, hashed server-side)
 * and `apps/marketing` (Pixel Advanced Matching, plain client-side). Drift between
 * the two causes silent Event Match Quality loss (the F6 bug).
 */

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
