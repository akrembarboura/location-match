import type { ANALYTICS_EVENT_NAMES } from "@/lib/models";

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type ActorType = "ANONYMOUS" | "CUSTOMER" | "OWNER" | "ADMIN";

export interface AnalyticsActor {
  type: ActorType;
  userId?: string;
  role?: string;
}

export interface TrackAnalyticsEventDTO {
  eventName: AnalyticsEventName;
  propertyId?: string;
  rentalCategory?: string;
  propertyType?: string;
  city?: string;
  anonymousId?: string;
  sessionId?: string;
  userId?: string;
  actorType?: ActorType;
  properties?: Record<string, unknown>;
  occurredAt?: Date;
}
