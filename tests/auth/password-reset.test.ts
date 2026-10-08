import { describe, it, expect } from "vitest";
import { authService } from "@/server/services/AuthService";
import { userRepository } from "@/server/repositories/UserRepository";
import connectToDatabase from "@/lib/mongoose";
import { checkRateLimit } from "@/server/utils/rate-limit";

describe("Password Reset & Rate Limiting System", () => {
  it("generates a reset token for an existing user and resets password successfully", async () => {
    await connectToDatabase();

    const uniqueEmail = `resettest_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;

    // 1. Create test user
    const user = await userRepository.create({
      id: `user-reset-${Date.now()}`,
      email: uniqueEmail,
      passwordHash: "oldpasswordhash",
      role: "CUSTOMER",
    });

    expect(user).toBeDefined();

    // 2. Request password reset
    const requestResult = await authService.requestPasswordReset(uniqueEmail);
    expect(requestResult.resetUrl).toBeDefined();
    expect(requestResult.resetUrl).toContain("token=");

    // Extract token from reset URL
    const token = requestResult.resetUrl!.split("token=")[1];
    expect(token).toBeTruthy();

    // Verify token exists in database
    const dbUser = await userRepository.findByResetToken(token);
    expect(dbUser).not.toBeNull();
    expect(dbUser?.email).toBe(uniqueEmail);

    // 3. Reset password
    const resetResult = await authService.resetPassword(token, "newsecurepassword123");
    expect(resetResult.message).toContain("réinitialisé avec succès");

    // 4. Token should be invalidated now
    const dbUserAfter = await userRepository.findByResetToken(token);
    expect(dbUserAfter).toBeNull();
  });

  it("handles forgot password gracefully for non-existent emails without leaking information", async () => {
    await connectToDatabase();
    const requestResult = await authService.requestPasswordReset("nonexistent_99999@example.com");
    expect(requestResult.message).toBeDefined();
    expect(requestResult.resetUrl).toBeUndefined();
  });

  it("rejects password reset with an invalid or expired token", async () => {
    await connectToDatabase();
    await expect(
      authService.resetPassword("invalid-token-xyz-12345", "newpassword123")
    ).rejects.toThrow("Le jeton de réinitialisation est invalide ou a expiré.");
  });

  it("enforces sliding token bucket rate limiting on requests", () => {
    const dummyReq = new Request("http://localhost:3000/api/auth/forgot-password", {
      headers: { "x-forwarded-for": "192.168.1.200" },
    });

    // Option: limit to 2 requests
    const res1 = checkRateLimit(dummyReq, { limit: 2, windowMs: 60000 });
    expect(res1).toBeNull();

    const res2 = checkRateLimit(dummyReq, { limit: 2, windowMs: 60000 });
    expect(res2).toBeNull();

    // 3rd attempt should trigger 429 Too Many Requests response
    const res3 = checkRateLimit(dummyReq, { limit: 2, windowMs: 60000 });
    expect(res3).not.toBeNull();
    expect(res3?.status).toBe(429);
  });
});

