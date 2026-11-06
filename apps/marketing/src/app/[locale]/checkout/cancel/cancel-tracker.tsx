"use client";

import { useEffect, useRef } from "react";
import { trackCheckoutAbandon } from "@/lib/analytics";
import { releaseAbandonedCheckout } from "@/lib/stock";

export function CancelPageTracker({ reason }: { reason?: string }) {
  const hasTracked = useRef(false);
  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      // Payment cancelled/rejected: free the stock held for this attempt.
      releaseAbandonedCheckout();
      trackCheckoutAbandon(
        reason === "rejected" ? "payment_rejected" : "payment_cancelled",
        0,
        0
      );
    }
  }, [reason]);

  return null;
}
