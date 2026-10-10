import type { RateLimitPolicy } from "./types";

// In local development, relax auth limits to avoid locking developers out during rapid UI testing.
// In production, conservative limits strictly apply to prevent credential stuffing and brute-force attacks.
const isDev = process.env.NODE_ENV === "development";

export const POLICIES = {
  AUTH_LOGIN: { name: "AUTH_LOGIN", limit: isDev ? 500 : 10, windowMs: 15 * 60 * 1000 },
  AUTH_REGISTER: { name: "AUTH_REGISTER", limit: isDev ? 200 : 5, windowMs: 60 * 60 * 1000 },
  AUTH_FORGOT_PASSWORD_IP: { name: "AUTH_FORGOT_PASSWORD_IP", limit: isDev ? 500 : 20, windowMs: 15 * 60 * 1000 },
  AUTH_FORGOT_PASSWORD_ACCOUNT: { name: "AUTH_FORGOT_PASSWORD_ACCOUNT", limit: isDev ? 200 : 5, windowMs: 60 * 60 * 1000 },
  AUTH_VERIFY_OTP: { name: "AUTH_VERIFY_OTP", limit: isDev ? 200 : 10, windowMs: 15 * 60 * 1000 },
  AUTH_RESEND_OTP: { name: "AUTH_RESEND_OTP", limit: isDev ? 100 : 3, windowMs: 15 * 60 * 1000 },
  AUTH_RESET_PASSWORD: { name: "AUTH_RESET_PASSWORD", limit: isDev ? 200 : 5, windowMs: 15 * 60 * 1000 },
  PUBLIC_API: { name: "PUBLIC_API", limit: isDev ? 2000 : 120, windowMs: 60 * 1000 },
  SEARCH: { name: "SEARCH", limit: isDev ? 1000 : 60, windowMs: 60 * 1000 },
  AUTHENTICATED_API: { name: "AUTHENTICATED_API", limit: isDev ? 2000 : 120, windowMs: 60 * 1000 },
  MUTATION: { name: "MUTATION", limit: isDev ? 500 : 30, windowMs: 60 * 1000 },
  ADMIN_API: { name: "ADMIN_API", limit: isDev ? 2000 : 120, windowMs: 60 * 1000 },
  OWNER_UPLOAD: { name: "OWNER_UPLOAD", limit: isDev ? 200 : 20, windowMs: 10 * 60 * 1000 },
} satisfies Record<string, RateLimitPolicy>;
