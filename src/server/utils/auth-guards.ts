import { authService } from "../services/AuthService";
import type { Role } from "@/lib/models";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Unauthenticated") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function requireAuth() {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as Role)) {
    throw new AuthorizationError(`Required one of roles: ${allowedRoles.join(', ')}`);
  }
  return user;
}

/** Roles allowed to create / edit / submit listings (mirrors middleware). */
export const OWNER_ACCESS_ROLES: Role[] = ["OWNER", "ADMIN", "SUPER_ADMIN"];

/**
 * Guards owner listing APIs. A CUSTOMER must first go through
 * POST /api/owner/onboard, which performs the role transition server-side.
 */
export async function requireOwnerAccess() {
  return requireRole(OWNER_ACCESS_ROLES);
}

/** 
 * Enforces ownership. E.g., if updating a property, pass property.ownerId.
 * Currently assumes resourceOwnerId matches the user ID. 
 * Alternatively, if an Owner profile ID differs from User ID, 
 * this check must map user.id to owner.id first.
 */
export async function requireOwnership(resourceOwnerUserId: string) {
  const user = await requireAuth();
  // Admins can bypass ownership checks usually, but let's keep it strict or explicit
  if (user.role === "SUPER_ADMIN") return user;
  
  if (user.id !== resourceOwnerUserId) {
    throw new AuthorizationError("You do not own this resource");
  }
  return user;
}
