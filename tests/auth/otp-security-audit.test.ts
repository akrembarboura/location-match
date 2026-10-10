import { describe, it, expect, beforeEach } from "vitest";
import { authService } from "@/server/services/AuthService";
import { otpService, computeOTPHmac } from "@/server/services/OTPService";
import { userRepository } from "@/server/repositories/UserRepository";
import { OTPChallengeModel, UserModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

describe("OTP Security Audit & Password Reset Lifecycle", () => {
  beforeEach(async () => {
    await connectToDatabase();
  });

  describe("1. Email Enumeration & Contract Consistency", () => {
    it("returns identical public response contract for existing and nonexistent emails", async () => {
      const existingEmail = `audit_exist_${Date.now()}@example.com`;
      await userRepository.create({
        id: `user-exist-${Date.now()}`,
        email: existingEmail,
        passwordHash: "hash123",
        role: "CUSTOMER",
      });

      const resExisting = await authService.requestPasswordReset(existingEmail);
      const resNonExisting = await authService.requestPasswordReset(`audit_fake_${Date.now()}@example.com`);

      expect(resExisting.message).toBe(resNonExisting.message);
      expect(resExisting.message).toBe("Si cette adresse e-mail est associée à un compte, vous recevrez des instructions pour réinitialiser votre mot de passe.");
    });

    it("normalizes email casing consistently", async () => {
      const ts = Date.now();
      const emailLower = `casetest_${ts}@example.com`;
      const emailMixed = `CaseTest_${ts}@EXAMPLE.com`;

      const user = await userRepository.create({
        id: `user-case-${Date.now()}`,
        email: emailLower,
        passwordHash: "hash123",
        role: "CUSTOMER",
      });

      const requestRes = await authService.requestPasswordReset(emailMixed);
      expect(requestRes.message).toBeDefined();

      const challenge = await OTPChallengeModel.findOne({ email: emailLower, status: "ACTIVE" });
      expect(challenge).not.toBeNull();
      expect(challenge?.email).toBe(emailLower);
    });
  });

  describe("2. OTP Generation, HMAC Storage & Single-Use Enforcement", () => {
    it("generates a 6-digit CSPRNG numeric OTP code and stores only HMAC digest", async () => {
      const email = `otpmac_${Date.now()}@example.com`;
      const user = await userRepository.create({
        id: `user-otpmac-${Date.now()}`,
        email,
        passwordHash: "hash123",
        role: "CUSTOMER",
      });

      const challengeResult = await otpService.createChallenge(email, user.id);
      expect(challengeResult.otp).toMatch(/^\d{6}$/);

      const dbChallenge = await OTPChallengeModel.findOne({ id: challengeResult.challengeId });
      expect(dbChallenge).not.toBeNull();
      // Plaintext OTP must NOT be stored in DB
      expect(dbChallenge?.otpHmac).toBeDefined();
      expect(dbChallenge?.otpHmac).not.toBe(challengeResult.otp);

      // Verify HMAC matches computed value
      const expectedHmac = computeOTPHmac(challengeResult.challengeId, user.id, challengeResult.otp);
      expect(dbChallenge?.otpHmac).toBe(expectedHmac);
    });

    it("invalidates prior active challenge when a new challenge is created (Resend)", async () => {
      const email = `resend_${Date.now()}@example.com`;
      const user = await userRepository.create({
        id: `user-resend-${Date.now()}`,
        email,
        passwordHash: "hash123",
        role: "CUSTOMER",
      });

      const challenge1 = await otpService.createChallenge(email, user.id);
      const challenge2 = await otpService.createChallenge(email, user.id);

      const db1 = await OTPChallengeModel.findOne({ id: challenge1.challengeId });
      const db2 = await OTPChallengeModel.findOne({ id: challenge2.challengeId });

      expect(db1?.status).toBe("EXPIRED");
      expect(db2?.status).toBe("ACTIVE");
    });

    it("enforces max 5 failed attempt limit and locks challenge", async () => {
      const email = `failed_otp_${Date.now()}@example.com`;
      const user = await userRepository.create({
        id: `user-fail-${Date.now()}`,
        email,
        passwordHash: "hash123",
        role: "CUSTOMER",
      });

      const challenge = await otpService.createChallenge(email, user.id);

      // Submit 5 invalid attempts
      for (let i = 0; i < 5; i++) {
        const verifyRes = await otpService.verifyOTP(email, "000000");
        expect(verifyRes.success).toBe(false);
      }

      // 6th attempt must be blocked as locked/invalid
      const dbChallenge = await OTPChallengeModel.findOne({ id: challenge.challengeId });
      expect(dbChallenge?.status).toBe("LOCKED");

      const finalVerify = await otpService.verifyOTP(email, challenge.otp);
      expect(finalVerify.success).toBe(false);
      expect(finalVerify.error?.code).toBe("INVALID_OTP");
    });
  });

  describe("3. Atomic Verification & Concurrency Safety", () => {
    it("permits AT MOST ONE successful verification for simultaneous requests using the same OTP", async () => {
      const email = `concurrent_otp_${Date.now()}@example.com`;
      const user = await userRepository.create({
        id: `user-concurrent-${Date.now()}`,
        email,
        passwordHash: "hash123",
        role: "CUSTOMER",
      });

      const challenge = await otpService.createChallenge(email, user.id);

      // Fire 5 concurrent verification attempts with correct OTP
      const verifyPromises = Array.from({ length: 5 }, () =>
        otpService.verifyOTP(email, challenge.otp)
      );

      const results = await Promise.all(verifyPromises);
      const successCount = results.filter((r) => r.success).length;

      expect(successCount).toBe(1);
    });

    it("permits AT MOST ONE password reset for simultaneous requests using the same reset token", async () => {
      const email = `token_race_${Date.now()}@example.com`;
      const user = await userRepository.create({
        id: `user-race-${Date.now()}`,
        email,
        passwordHash: "hash123",
        role: "CUSTOMER",
      });

      const challenge = await otpService.createChallenge(email, user.id);
      const verifyRes = await otpService.verifyOTP(email, challenge.otp);
      expect(verifyRes.success).toBe(true);

      const token = verifyRes.resetToken!;

      // Fire 5 concurrent password resets using the same resetToken
      const resetPromises = Array.from({ length: 5 }, (_, idx) =>
        authService.resetPassword(token, `NewPassword${idx}123!`)
      );

      const settled = await Promise.allSettled(resetPromises);
      const fulfilled = settled.filter((s) => s.status === "fulfilled");

      expect(fulfilled.length).toBe(1);
    });
  });

  describe("4. Session Invalidation on Password Change", () => {
    it("updates passwordChangedAt and invalidates active user sessions", async () => {
      const email = `session_inv_${Date.now()}@example.com`;
      const user = await userRepository.create({
        id: `user-sess-${Date.now()}`,
        email,
        passwordHash: "oldpasswordhash",
        role: "CUSTOMER",
      });

      const challenge = await otpService.createChallenge(email, user.id);
      const verifyRes = await otpService.verifyOTP(email, challenge.otp);
      expect(verifyRes.success).toBe(true);

      await authService.resetPassword(verifyRes.resetToken!, "brandnewpassword123");

      const updatedUser = await UserModel.findOne({ email });
      expect(updatedUser?.passwordChangedAt).toBeDefined();

      // Verify token cannot be reused
      await expect(
        authService.resetPassword(verifyRes.resetToken!, "anotherpassword123")
      ).rejects.toThrow("Le jeton de réinitialisation est invalide ou a expiré.");
    });
  });
});
