"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { getConsentStatus } from "@/lib/analytics/consent";

export function AnalyticsPageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPath.current === pathname) return;

    lastPath.current = pathname;

    if (getConsentStatus() === "denied") return;

    trackEvent("page_viewed", {
      forceTrack: true,
      properties: {
        path: pathname,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  }, [pathname]);

  return null;
}
