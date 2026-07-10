"use client";

import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api-client";

export type TabbyEligibility = "loading" | "available" | "unavailable";

interface UseTabbyEligibilityArgs {
  amount: number;
  email?: string;
  phone?: string;
  enabled: boolean;
}

const cache = new Map<string, boolean>();

/**
 * Background pre-scoring (eligibility) check for Tabby.
 * https://docs.tabby.ai/pay-in-4-custom-integration/checkout-flow#background-pre-scoring-check
 *
 * - Fires once amount + buyer email + phone are known (debounced).
 * - Fail-safe: on any error/timeout Tabby stays selectable (returned as
 *   "available"). The authoritative check reruns at session creation.
 * - Returns "unavailable" only on a definitive Tabby rejection, which hides the
 *   Tabby option so checkout never silently dead-ends.
 */
export function useTabbyEligibility({
  amount,
  email,
  phone,
  enabled,
}: UseTabbyEligibilityArgs): TabbyEligibility {
  const [eligibility, setEligibility] = useState<TabbyEligibility>("loading");

  const hasContact = !!email && !!phone;
  const key = `${(amount || 0).toFixed(2)}|${email || ""}|${phone || ""}`;

  useEffect(() => {
    if (!enabled || !amount || amount <= 0 || !hasContact) {
      setEligibility("loading");
      return;
    }

    // Serve cached result immediately for the same cart+contact.
    if (cache.has(key)) {
      setEligibility(cache.get(key) ? "available" : "unavailable");
      return;
    }

    let active = true;
    setEligibility("loading");
    const timer = setTimeout(() => {
      apiPost<{ success: boolean; data: { available: boolean } }>(
        "/api/payments/tabby/eligibility",
        { amount, email, phone }
      )
        .then((res) => {
          if (!active) return;
          const available = res.data?.available ?? true;
          cache.set(key, available);
          setEligibility(available ? "available" : "unavailable");
        })
        .catch(() => {
          if (active) setEligibility("available"); // fail-safe
        });
    }, 600);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, amount, hasContact, key]);

  return eligibility;
}
