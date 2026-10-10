import mongoose from "mongoose";
import { userRepository } from "../repositories/UserRepository";
import type { LoginInput, RegisterInput } from "../validations/auth";
import { mapUserToPrivateDTO } from "../dtos/user";
import { signJwtToken, getSession } from "../utils/auth";
import { setSessionCookie, deleteSessionCookie } from "../utils/session-cookie";
import { OwnerModel, UserModel } from "@/lib/models";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { emailService } from "../notifications/email.service";
import { otpService, computeOTPHmac } from "./OTPService";

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);
    
    const newId = crypto.randomUUID();

    // Allow CUSTOMER or OWNER registration role (preventing ADMIN/SUPER_ADMIN escalation)
    const assignedRole = input.role === "OWNER" ? "OWNER" : "CUSTOMER";

    const userDoc = await userRepository.create({
      id: newId,
      email: input.email,
      passwordHash,
      role: assignedRole,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    });

    if (assignedRole === "OWNER") {
      const name = [input.firstName, input.lastName].filter(Boolean).join(" ") || input.email;
      await OwnerModel.create({
        id: `OWNER-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        userId: newId,
        name,
        phone: input.phone || "—",
        area: "Mahdia",
        properties: 0,
        since: new Date().getFullYear().toString(),
      });
    }

    const dto = mapUserToPrivateDTO(userDoc);
    const token = await signJwtToken({ sub: dto.id, role: dto.role as any, email: dto.email });
    await setSessionCookie(token);
    return dto;
  }

  async login(input: LoginInput) {
    const userDoc = await userRepository.findByEmail(input.email);
    if (!userDoc) {
      const err: any = new Error("Invalid email or password");
      err.code = "INVALID_CREDENTIALS";
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(input.password, userDoc.passwordHash);
    if (!isMatch) {
      const err: any = new Error("Invalid email or password");
      err.code = "INVALID_CREDENTIALS";
      err.statusCode = 401;
      throw err;
    }

    const status = userDoc.status || "ACTIVE";

    if (status === "REJECTED") {
      const err: any = new Error("Votre compte propriétaire a été rejeté. Vous pouvez contacter LOC MAISON pour plus d'informations.");
      err.code = "ACCOUNT_REJECTED";
      err.statusCode = 403;
      throw err;
    }

    if (status === "PENDING") {
      const err: any = new Error("Votre demande est en cours de vérification par l'équipe LOC MAISON.");
      err.code = "ACCOUNT_PENDING";
      err.statusCode = 403;
      throw err;
    }

    if (status === "SUSPENDED") {
      const err: any = new Error("Votre compte est temporairement suspendu. Veuillez contacter LOC MAISON.");
      err.code = "ACCOUNT_SUSPENDED";
      err.statusCode = 403;
      throw err;
    }

    if (status === "DISABLED") {
      const err: any = new Error("Ce compte a été désactivé.");
      err.code = "ACCOUNT_DISABLED";
      err.statusCode = 403;
      throw err;
    }

    const dto = mapUserToPrivateDTO(userDoc);
    const token = await signJwtToken({ sub: dto.id, role: dto.role as any, email: dto.email });
    await setSessionCookie(token);
    return dto;
  }

  async logout() {
    await deleteSessionCookie();
  }

  async getCurrentUser() {
    const session = await getSession();
    if (!session) return null;

    const userDoc = await userRepository.findById(session.sub);
    if (!userDoc) return null;

    const status = userDoc.status || "ACTIVE";
    if (status !== "ACTIVE") {
      return null;
    }

    return mapUserToPrivateDTO(userDoc);
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const userDoc = await userRepository.findByEmail(normalizedEmail);
    const genericMessage = "Si cette adresse e-mail est associée à un compte, vous recevrez des instructions pour réinitialiser votre mot de passe.";

    if (!userDoc) {
      // Simulate constant-time work to prevent timing side-channel email enumeration
      computeOTPHmac("dummy-challenge-id", "dummy-user-id", "123456");
      return { message: genericMessage };
    }

    const userId = (userDoc.id || userDoc._id).toString();
    const challenge = await otpService.createChallenge(normalizedEmail, userId);

    const resetToken = crypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + 3600000);
    await userRepository.setResetToken(userDoc.id || userId, resetToken, expires);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Dispatch transactional email asynchronously
    emailService.sendPasswordResetEmail(userDoc.email, resetUrl).catch((err) => {
      console.error("[AUTH] Failed to send password reset email:", err);
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUTH] OTP generated for ${normalizedEmail}: [PROTECTED]`);
    }

    return {
      message: genericMessage,
      // Internal fields for unit test helpers
      _internal: {
        otp: challenge.otp,
        challengeId: challenge.challengeId,
        resetUrl,
      },
      resetUrl,
    };
  }

  async verifyOTP(email: string, otp: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await otpService.verifyOTP(normalizedEmail, otp);

    if (!result.success || !result.resetToken) {
      const err: any = new Error(result.error?.message || "Code OTP invalide ou expiré.");
      err.code = result.error?.code || "INVALID_OTP";
      err.statusCode = 400;
      err.attemptsRemaining = result.error?.attemptsRemaining;
      throw err;
    }

    return {
      message: "Code OTP vérifié avec succès.",
      resetToken: result.resetToken,
    };
  }

  async resendOTP(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const genericMessage = "Si un défi est actif pour ce compte, un nouveau code a été envoyé.";

    const cooldown = await otpService.getResendCooldown(normalizedEmail);
    if (cooldown.inCooldown) {
      const err: any = new Error(`Veuillez attendre ${cooldown.retryAfterSeconds} seconde(s) avant de demander un nouveau code.`);
      err.code = "TOO_MANY_REQUESTS";
      err.statusCode = 429;
      err.retryAfterSeconds = cooldown.retryAfterSeconds;
      throw err;
    }

    const userDoc = await userRepository.findByEmail(normalizedEmail);
    if (!userDoc) {
      computeOTPHmac("dummy-challenge-id", "dummy-user-id", "123456");
      return { message: genericMessage };
    }

    const userId = (userDoc.id || userDoc._id as string).toString();
    const challenge = await otpService.createChallenge(normalizedEmail, userId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(normalizedEmail)}`;

    emailService.sendPasswordResetEmail(userDoc.email, resetUrl).catch((err) => {
      console.error("[AUTH] Failed to send resend password reset email:", err);
    });

    return {
      message: genericMessage,
      _internal: {
        otp: challenge.otp,
        challengeId: challenge.challengeId,
      },
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Try consuming verified OTP reset token atomically
    const tokenResult = await otpService.consumeResetToken(token);
    let userId: string | null = tokenResult.userId || null;

    if (!userId) {
      // 2. Fallback to legacy single-use reset token in User document if available
      const legacyUser = await userRepository.findByResetToken(token);
      if (legacyUser) {
        userId = (legacyUser.id || legacyUser._id as string).toString();
      }
    }

    if (!userId) {
      const err: any = new Error("Le jeton de réinitialisation est invalide ou a expiré.");
      err.code = "INVALID_RESET_TOKEN";
      err.statusCode = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and record passwordChangedAt timestamp to revoke prior active sessions
    await userRepository.updatePassword(userId, passwordHash);

    const userQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ id: userId }, { _id: userId }] }
      : { id: userId };

    await UserModel.updateOne(
      userQuery,
      {
        $set: { passwordChangedAt: new Date() },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      }
    );

    return { message: "Votre mot de passe a été réinitialisé avec succès." };
  }
}

export const authService = new AuthService();

