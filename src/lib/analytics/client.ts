"use client";

import { useEffect, useRef } from "react";
import { getConsentStatus } from "./consent";
import type { AnalyticsEventName } from "@/lib/models";

export type AnalyticsPayload = {
  propertyId?: string;
  rentalCategory?: string;
  propertyType?: string;
  city?: string;
  actorType?: "ANONYMOUS" | "CUSTOMER" | "OWNER" | "ADMIN";
  properties?: Record<string, unknown>;
  forceTrack?: boolean;
  [key: string]: unknown;
};

function getAnonymousId(): string {
  if (typeof window === "undefined") return "anon-server";
  try {
    let anonId = localStorage.getItem("loc_maison_anon_id");
    if (!anonId) {
      anonId = "anon-" + Math.random().toString(36).substring(2, 10) + "-" + Date.now().toString(36);
      localStorage.setItem("loc_maison_anon_id", anonId);
    }
    return anonId;
  } catch {
    return "anon-fallback";
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "sess-server";
  try {
    let sessId = sessionStorage.getItem("loc_maison_session_id");
    if (!sessId) {
      sessId = "sess-" + Math.random().toString(36).substring(2, 10) + "-" + Date.now().toString(36);
      sessionStorage.setItem("loc_maison_session_id", sessId);
    }
    return sessId;
  } catch {
    return "sess-fallback";
  }
}

export function trackEvent(eventName: AnalyticsEventName | string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  try {
    // Privacy check: if user explicitly denied cookies and not forceTrack, do not attach identifiers
    const consent = getConsentStatus();
    if (consent === "denied" && !payload.forceTrack) {
      return;
    }

    const anonymousId = consent === "denied" ? undefined : getAnonymousId();
    const sessionId = consent === "denied" ? undefined : getSessionId();

    const body = {
      eventName,
      propertyId: payload.propertyId,
      rentalCategory: payload.rentalCategory,
      propertyType: payload.propertyType,
      city: payload.city,
      actorType: payload.actorType || "ANONYMOUS",
      anonymousId,
      sessionId,
      properties: payload.properties || {},
      occurredAt: new Date().toISOString(),
    };

    // 1. Dispatch custom DOM event for in-browser reactivity
    window.dispatchEvent(
      new CustomEvent("locmaison:analytics", { detail: { event: eventName, payload } })
    );

    // 2. Transmit to production analytics endpoint
    fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Analytics must never break or degrade application experience
    });
  } catch {
    // Silent fail
  }
}

export function useTrackPropertyView(
  property:
    | {
        id?: string;
        slug?: string;
        city?: string;
        rentalCategory?: string;
        propertyType?: string;
      }
    | null
    | undefined
) {
  const lastTrackedId = useRef<string | null>(null);

  useEffect(() => {
    if (!property?.id) return;
    if (lastTrackedId.current === property.id) return;

    lastTrackedId.current = property.id;
    trackEvent("property_viewed", {
      propertyId: property.id,
      city: property.city,
      rentalCategory: property.rentalCategory,
      propertyType: property.propertyType,
      forceTrack: true,
      properties: {
        slug: property.slug,
      },
    });
  }, [property?.id, property?.city, property?.rentalCategory, property?.propertyType, property?.slug]);
}


