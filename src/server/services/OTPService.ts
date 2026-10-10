import crypto from "crypto";
import connectToDatabase from "@/lib/mongoose";
import { OTPChallengeModel } from "@/lib/models";

const OTP_SECRET = process.env.OTP_SECRET || "locmaison-secure-server-side-otp-hmac-secret-key-2026";
const OTP_TTL_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 60 seconds
const MAX_FAILED_ATTEMPTS = 5;
const RESET_TOKEN_TTL_SECONDS = 600; // 10 minutes

export function computeOTPHmac(challengeId: string, userId: string, otp: string): string {
  const payload = `${challengeId}:${userId}:${otp}:PASSWORD_RESET`;
  return crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
}

export function computeTokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface CreateOTPChallengeResult {
  challengeId: string;
  otp: string;
  expiresAt: Date;
  resendAllowedAt: Date;
}

export interface VerifyOTPResult {
  success: boolean;
  resetToken?: string;
  error?: {
    code: string;
    message: string;
    attemptsRemaining?: number;
  };
}

export class OTPService {
  /**
   * Generates a CSPRNG 6-digit numeric OTP code.
   */
  generateOTPCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Creates or updates an active OTP challenge for the specified email and userId.
   * Invalidates any pre-existing ACTIVE challenge for this account.
   */
  async createChallenge(email: string, userId: string): Promise<CreateOTPChallengeResult> {
    await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // 1. Invalidate previous active challenges for this email
    await OTPChallengeModel.updateMany(
      { email: normalizedEmail, status: "ACTIVE" },
      { $set: { status: "EXPIRED" } }
    );

    // 2. Generate CSPRNG OTP and Challenge ID
    const challengeId = `OTP-${crypto.randomUUID()}`;
    const otp = this.generateOTPCode();
    const otpHmac = computeOTPHmac(challengeId, userId, otp);

    const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);
    const resendAllowedAt = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

    // 3. Store challenge in DB
    await OTPChallengeModel.create({
      id: challengeId,
      email: normalizedEmail,
      userId,
      otpHmac,
      status: "ACTIVE",
      attempts: 0,
      resendAllowedAt,
      expiresAt,
    });

    return {
      challengeId,
      otp,
      expiresAt,
      resendAllowedAt,
    };
  }

  /**
   * Checks if an account is currently in resend cooldown.
   */
  async getResendCooldown(email: string): Promise<{ inCooldown: boolean; retryAfterSeconds: number }> {
    await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const activeChallenge = await OTPChallengeModel.findOne({
      email: normalizedEmail,
      status: "ACTIVE",
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    if (!activeChallenge || !activeChallenge.resendAllowedAt) {
      return { inCooldown: false, retryAfterSeconds: 0 };
    }

    if (now < activeChallenge.resendAllowedAt) {
      const retryAfterSeconds = Math.ceil((activeChallenge.resendAllowedAt.getTime() - now.getTime()) / 1000);
      return { inCooldown: true, retryAfterSeconds };
    }

    return { inCooldown: false, retryAfterSeconds: 0 };
  }

  /**
   * Atomically verifies a 6-digit OTP code against an active challenge.
   * Prevents race conditions using atomic update operations.
   */
  async verifyOTP(email: string, submittedOTP: string): Promise<VerifyOTPResult> {
    await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // 1. Find active challenge
    const challenge = await OTPChallengeModel.findOne({
      email: normalizedEmail,
      status: "ACTIVE",
      expiresAt: { $gt: now },
    });

    if (!challenge) {
      return {
        success: false,
        error: {
          code: "INVALID_OTP",
          message: "Code OTP invalide ou expiré.",
        },
      };
    }

    // Check attempt limit
    if (challenge.attempts >= MAX_FAILED_ATTEMPTS) {
      await OTPChallengeModel.updateOne(
        { id: challenge.id, status: "ACTIVE" },
        { $set: { status: "LOCKED" } }
      );
      return {
        success: false,
        error: {
          code: "OTP_LOCKED",
          message: "Nombre maximum de tentatives dépassé. Veuillez demander un nouveau code.",
        },
      };
    }

    // 2. Compute expected HMAC
    const expectedHmac = computeOTPHmac(challenge.id, challenge.userId, submittedOTP);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(challenge.otpHmac),
      Buffer.from(expectedHmac)
    );

    if (!isValid) {
      const nextAttempts = challenge.attempts + 1;
      const isLocked = nextAttempts >= MAX_FAILED_ATTEMPTS;

      await OTPChallengeModel.updateOne(
        { id: challenge.id, status: "ACTIVE" },
        {
          $inc: { attempts: 1 },
          $set: isLocked ? { status: "LOCKED" } : {},
        }
      );

      const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - nextAttempts);

      return {
        success: false,
        error: {
          code: isLocked ? "OTP_LOCKED" : "INVALID_OTP",
          message: isLocked
            ? "Nombre maximum de tentatives dépassé. Veuillez demander un nouveau code."
            : `Code OTP incorrect. ${attemptsRemaining} tentative(s) restante(s).`,
          attemptsRemaining,
        },
      };
    }

    // 3. Match success: Atomically issue opaque reset token and transition to VERIFIED
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = computeTokenHash(resetToken);
    const resetTokenExpiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_SECONDS * 1000);

    const updated = await OTPChallengeModel.findOneAndUpdate(
      { id: challenge.id, status: "ACTIVE", expiresAt: { $gt: now } },
      {
        $set: {
          status: "VERIFIED",
          resetTokenHash,
          resetTokenExpiresAt,
        },
      },
      { new: true }
    );

    if (!updated) {
      // Challenge was already consumed concurrently
      return {
        success: false,
        error: {
          code: "INVALID_OTP",
          message: "Code OTP déjà utilisé ou expiré.",
        },
      };
    }

    return {
      success: true,
      resetToken,
    };
  }

  /**
   * Consumes a verified reset token atomically to complete password reset.
   */
  async consumeResetToken(resetToken: string): Promise<{ success: boolean; userId?: string }> {
    await connectToDatabase();
    const tokenHash = computeTokenHash(resetToken);
    const now = new Date();

    const challenge = await OTPChallengeModel.findOneAndUpdate(
      {
        resetTokenHash: tokenHash,
        status: "VERIFIED",
        resetTokenExpiresAt: { $gt: now },
      },
      {
        $set: { status: "CONSUMED" },
      },
      { new: true }
    );

    if (!challenge) {
      return { success: false };
    }

    return { success: true, userId: challenge.userId };
  }
}

export const otpService = new OTPService();
