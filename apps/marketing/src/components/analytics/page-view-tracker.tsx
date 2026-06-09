"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { fbPageView } from "@/lib/facebook-pixel";

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef("");

  useEffect(() => {
    const key = `${pathname}?${searchParams}`;
    if (key !== lastTracked.current) {
      lastTracked.current = key;
      fbPageView();
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
