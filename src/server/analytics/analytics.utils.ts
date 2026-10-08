import crypto from "crypto";

export function sanitizeAnalyticsMetadata(properties: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...properties };

  // Remove potential sensitive PII keys
  const forbiddenKeys = ["password", "passwordHash", "token", "creditCard", "cvv", "ssn", "secret"];
  for (const key of Object.keys(sanitized)) {
    if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk))) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

export function generateAnonymousId(): string {
  return `anon-${crypto.randomBytes(8).toString("hex")}`;
}

export function generateSessionId(): string {
  return `sess-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}
