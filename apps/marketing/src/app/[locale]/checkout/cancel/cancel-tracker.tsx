"use client";

import { useEffect } from "react";
import { trackCheckoutAbandon } from "@/lib/analytics";

export function CancelPageTracker() {
  useEffect(() => {
    trackCheckoutAbandon("payment_cancelled", 0, 0);
  }, []);

  return null;
}
