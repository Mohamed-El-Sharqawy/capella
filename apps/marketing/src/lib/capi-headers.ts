import { getFbp, getFbc } from "./meta-cookies";

export function capiHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const headers: Record<string, string> = {};
  const fbp = getFbp();
  if (fbp) headers["x-fbp"] = fbp;
  const fbc = getFbc();
  if (fbc) headers["x-fbc"] = fbc;
  return headers;
}
