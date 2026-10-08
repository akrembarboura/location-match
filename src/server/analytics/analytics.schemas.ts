import { z } from "zod";
import { ANALYTICS_EVENT_NAMES } from "@/lib/models";

export const TrackEventSchema = z.object({
  eventName: z.enum(ANALYTICS_EVENT_NAMES, {
    errorMap: () => ({ message: "Nom d'événement d'analyse non valide." }),
  }),
  propertyId: z.string().optional(),
  rentalCategory: z.string().optional(),
  propertyType: z.string().optional(),
  city: z.string().optional(),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  actorType: z.enum(["ANONYMOUS", "CUSTOMER", "OWNER", "ADMIN"]).optional().default("ANONYMOUS"),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  occurredAt: z.string().or(z.date()).optional(),
});

export type TrackEventSchemaType = z.infer<typeof TrackEventSchema>;
