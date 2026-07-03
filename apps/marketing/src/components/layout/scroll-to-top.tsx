"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Forces an instant scroll to the top on every route (pathname) change.
 *
 * Next.js tries to do this automatically, but it can be defeated by
 * `scroll-behavior: smooth` (which animates the jump) and async page content,
 * leaving the browser at a stale scroll position — often visible as blank
 * space below the footer after navigating. We override the scroll behavior to
 * "auto" for the reset so it is always immediate.
 *
 * Only the pathname triggers a reset, so query-only changes (e.g. selecting a
 * payment method or applying a coupon) keep their scroll position.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => {
      html.style.scrollBehavior = previousBehavior;
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
