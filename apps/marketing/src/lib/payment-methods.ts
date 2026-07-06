"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./api-client";

export interface PaymentMethods {
  cod: boolean;
  ziina: boolean;
  tabby: boolean;
  tamara: boolean;
}

// Fail-closed: if we can't confirm a BNPL provider is enabled, hide it.
// COD and Ziina are always available regardless of the fetch result.
const FALLBACK: PaymentMethods = {
  cod: true,
  ziina: true,
  tabby: false,
  tamara: false,
};

let cache: PaymentMethods | null = null;
let inflight: Promise<PaymentMethods> | null = null;

/**
 * Fetches the enabled payment methods from the backend (single source of
 * truth — see `TABBY_ENABLED` / `TAMARA_ENABLED`). Cached at module scope so
 * every component calling the hook shares one request per page load.
 */
export function fetchPaymentMethods(): Promise<PaymentMethods> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = apiGet<{ success: boolean; data: PaymentMethods }>(
      "/api/payments/methods"
    )
      .then((res) => {
        cache = res.data ?? FALLBACK;
        return cache;
      })
      .catch(() => {
        cache = FALLBACK;
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Returns `null` while loading, then the enabled-state. Fail-closed. */
export function usePaymentMethods(): PaymentMethods | null {
  const [methods, setMethods] = useState<PaymentMethods | null>(null);
  useEffect(() => {
    fetchPaymentMethods().then(setMethods);
  }, []);
  return methods;
}
