import { describe, it, expect } from "vitest";
import { authService } from "@/server/services/AuthService";
import { userRepository } from "@/server/repositories/UserRepository";
import connectToDatabase from "@/lib/mongoose";
import { rateLimit } from "@/server/rate-limit";

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
    const token = requestResult.resetUrl!.split("token=")[1].split("&")[0];
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

  it("enforces sliding token bucket rate limiting on requests using atomic store", async () => {
    // Option: limit to 2 requests
    const policy = { name: "TEST_AUTH", limit: 2, windowMs: 60000 };
    const ipKey = "rate-limit:TEST_AUTH:192.168.1.200";

    const res1 = await rateLimit(ipKey, policy);
    expect(res1.success).toBe(true);

    const res2 = await rateLimit(ipKey, policy);
    expect(res2.success).toBe(true);

    // 3rd attempt should fail
    const res3 = await rateLimit(ipKey, policy);
    expect(res3.success).toBe(false);
  });
});

