"use client";

import { useEffect, useRef } from "react";
import { trackCheckoutAbandon } from "@/lib/analytics";

export function CancelPageTracker() {
  const hasTracked = useRef(false);
  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackCheckoutAbandon("payment_cancelled", 0, 0);
    }
  }, []);

  return null;
}
