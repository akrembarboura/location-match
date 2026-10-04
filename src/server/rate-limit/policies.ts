import type { RateLimitPolicy } from "./types";

export const POLICIES: Record<string, RateLimitPolicy> = {
  AUTH_LOGIN: { name: "AUTH_LOGIN", limit: 10, windowMs: 15 * 60 * 1000 },
  AUTH_REGISTER: { name: "AUTH_REGISTER", limit: 5, windowMs: 60 * 60 * 1000 },
  PUBLIC_API: { name: "PUBLIC_API", limit: 120, windowMs: 60 * 1000 },
  SEARCH: { name: "SEARCH", limit: 60, windowMs: 60 * 1000 },
  AUTHENTICATED_API: { name: "AUTHENTICATED_API", limit: 120, windowMs: 60 * 1000 },
  MUTATION: { name: "MUTATION", limit: 30, windowMs: 60 * 1000 },
  ADMIN_API: { name: "ADMIN_API", limit: 120, windowMs: 60 * 1000 },
};
