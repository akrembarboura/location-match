import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireRole, requireOwnership } from "@/server/utils/auth-guards";
import * as authServiceModule from "@/server/services/AuthService";

describe("Auth Guards & RBAC Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("G6: Unauthenticated user receives 401 via AuthenticationError", async () => {
    vi.spyOn(authServiceModule.authService, "getCurrentUser").mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow("Unauthenticated");
  });

  it("G1, G2, G3, G7: Authenticated but unauthorized user receives 403", async () => {
    vi.spyOn(authServiceModule.authService, "getCurrentUser").mockResolvedValue({
      id: "u1", role: "CUSTOMER", email: "test@test.com"
    } as any);

    // Customer accessing admin
    await expect(requireRole(["ADMIN"])).rejects.toThrow("Required one of roles: ADMIN");
    // Customer accessing owner
    await expect(requireRole(["OWNER"])).rejects.toThrow("Required one of roles: OWNER");
  });

  it("G4, G5: Authorized role can access", async () => {
    vi.spyOn(authServiceModule.authService, "getCurrentUser").mockResolvedValue({
      id: "u2", role: "ADMIN", email: "admin@test.com"
    } as any);
    
    const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    expect(user.role).toBe("ADMIN");
  });

  it("H1: Owner can access their own resource", async () => {
    vi.spyOn(authServiceModule.authService, "getCurrentUser").mockResolvedValue({
      id: "owner123", role: "OWNER", email: "owner@test.com"
    } as any);

    const user = await requireOwnership("owner123");
    expect(user.id).toBe("owner123");
  });

  it("H2 & H3: Owner/Customer cannot access another's resource", async () => {
    vi.spyOn(authServiceModule.authService, "getCurrentUser").mockResolvedValue({
      id: "owner123", role: "OWNER", email: "owner@test.com"
    } as any);

    await expect(requireOwnership("otherOwner")).rejects.toThrow("You do not own this resource");
  });

  it("H5: SUPER_ADMIN override works", async () => {
    vi.spyOn(authServiceModule.authService, "getCurrentUser").mockResolvedValue({
      id: "super1", role: "SUPER_ADMIN", email: "super@test.com"
    } as any);

    // Bypasses ownership check
    const user = await requireOwnership("someOtherUser");
    expect(user.id).toBe("super1");
  });
});

