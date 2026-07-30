"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { fbPageView } from "@/lib/facebook-pixel";
import { pushToDataLayer } from "@/lib/gtm";

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef("");

  useEffect(() => {
    const key = `${pathname}?${searchParams}`;
    if (key !== lastTracked.current) {
      lastTracked.current = key;
      fbPageView();
      // Virtual pageview for GTM (GA4 page_view). The GTM container must fire
      // GA4 page_view off this Custom Event, not the default History Change
      // trigger, to avoid a double pageview on the first navigation.
      pushToDataLayer({
        event: "page_view",
        page_path: pathname,
        page_location: window.location.href,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
