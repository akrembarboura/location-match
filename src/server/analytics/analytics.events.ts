import { analyticsRepository } from "./AnalyticsRepository";
import { sanitizeAnalyticsMetadata } from "./analytics.utils";
import type { TrackAnalyticsEventDTO } from "./analytics.dto";

export async function trackBusinessEvent(event: TrackAnalyticsEventDTO): Promise<void> {
  try {
    const sanitizedProps = sanitizeAnalyticsMetadata(event.properties || {});
    await analyticsRepository.recordEvent({
      ...event,
      properties: sanitizedProps,
      occurredAt: event.occurredAt || new Date(),
    });
  } catch (error) {
    // Non-blocking business tracking logger
    console.error("Non-blocking analytics event tracking error:", error);
  }
}

export const AnalyticsEventTriggers = {
  trackReservationCreated: (params: { reservationId: string; propertyId: string; ownerId: string; customerId?: string; total: number }) =>
    trackBusinessEvent({
      eventName: "reservation_confirmed",
      propertyId: params.propertyId,
      userId: params.customerId,
      actorType: params.customerId ? "CUSTOMER" : "ANONYMOUS",
      properties: {
        reservationId: params.reservationId,
        ownerId: params.ownerId,
        total: params.total,
      },
    }),

  trackPropertyApproved: (params: { propertyId: string; adminId: string }) =>
    trackBusinessEvent({
      eventName: "property_approved",
      propertyId: params.propertyId,
      userId: params.adminId,
      actorType: "ADMIN",
      properties: { adminId: params.adminId },
    }),

  trackPropertyRejected: (params: { propertyId: string; adminId: string; reason?: string }) =>
    trackBusinessEvent({
      eventName: "property_rejected",
      propertyId: params.propertyId,
      userId: params.adminId,
      actorType: "ADMIN",
      properties: { adminId: params.adminId, reason: params.reason },
    }),
};
