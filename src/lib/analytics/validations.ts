import { z } from "zod";
import { ANALYTICS_EVENT_NAMES } from "@/lib/models";

const FORBIDDEN_PROPERTIES_KEYS = [
  "password",
  "passwordhash",
  "token",
  "secret",
  "jwt",
  "auth",
  "email",
  "phone",
  "creditcard",
  "cvv",
];

function sanitizeProperties(record: unknown): Record<string, unknown> {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return {};
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_PROPERTIES_KEYS.some((forbidden) => lowerKey.includes(forbidden))) {
      continue; // Skip sensitive keys
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      cleaned[key] = value;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.slice(0, 20).filter((v) => typeof v === "string" || typeof v === "number");
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = sanitizeProperties(value);
    }
  }

  return cleaned;
}

export const TrackEventInputSchema = z.object({
  eventName: z.enum(ANALYTICS_EVENT_NAMES, {
    errorMap: () => ({ message: "Nom d'événement analytique non reconnu." }),
  }),
  propertyId: z.string().max(100).optional(),
  rentalCategory: z.string().max(50).optional(),
  propertyType: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  anonymousId: z.string().max(100).optional(),
  sessionId: z.string().max(100).optional(),
  actorType: z.enum(["ANONYMOUS", "CUSTOMER", "OWNER", "ADMIN"]).optional(),
  properties: z.unknown().transform(sanitizeProperties).optional(),
  occurredAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
});

export type TrackEventInput = z.infer<typeof TrackEventInputSchema>;

export const AnalyticsPeriodSchema = z.enum(["7d", "30d", "90d", "all"]).default("30d");
export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriodSchema>;
