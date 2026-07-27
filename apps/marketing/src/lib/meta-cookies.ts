// Body-passing fallback for `_fbp` / `_fbc`. The canonical cross-origin path is
// `capiHeaders()` (lib/capi-headers.ts), which forwards the same values as
// `x-fbp` / `x-fbc` headers on every fetch. These remain only so the body-based
// fields can be populated for non-breaking migration; remove once headers are
// verified end-to-end in Events Manager.
export function getFbp(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getFbc(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}
