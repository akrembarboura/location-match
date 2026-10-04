import type { UserRole } from "./types";

/**
 * Only same-origin relative paths are accepted as post-auth destinations.
 * Rejects absolute URLs, protocol-relative URLs ("//evil.com"), backslash
 * tricks ("/\\evil.com") and loops back to the auth pages themselves.
 */
export function getSafeCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  const path = value.split(/[?#]/)[0];
  if (path === "/login" || path === "/register") return null;
  return value;
}

/** Default landing page per role, matching the routes guarded by middleware. */
export function getDefaultRouteForRole(role: UserRole | undefined): string {
  switch (role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    case "OWNER":
      return "/owner";
    default:
      return "/dashboard";
  }
}

export function getPostAuthRedirect(role: UserRole | undefined, callbackUrl: string | null | undefined): string {
  return getSafeCallbackUrl(callbackUrl) ?? getDefaultRouteForRole(role);
}

/** Builds "/login?callbackUrl=..." / "/register?callbackUrl=..." links that keep the destination. */
export function withCallbackUrl(path: "/login" | "/register", callbackUrl: string | null | undefined): string {
  const safe = getSafeCallbackUrl(callbackUrl);
  return safe ? `${path}?callbackUrl=${encodeURIComponent(safe)}` : path;
}
