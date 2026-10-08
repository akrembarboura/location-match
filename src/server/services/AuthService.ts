import { userRepository } from "../repositories/UserRepository";
import type { LoginInput, RegisterInput } from "../validations/auth";
import { mapUserToPrivateDTO } from "../dtos/user";
import { signJwtToken, getSession } from "../utils/auth";
import { setSessionCookie, deleteSessionCookie } from "../utils/session-cookie";
import { OwnerModel } from "@/lib/models";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { emailService } from "../notifications/email.service";

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
    const userDoc = await userRepository.findByEmail(email);
    // Generic message to avoid email enumeration attack
    const genericResponse = {
      message: "Si cette adresse e-mail est associée à un compte, vous recevrez un lien de réinitialisation.",
    };

    if (!userDoc) {
      return genericResponse;
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await userRepository.setResetToken(userDoc.id || (userDoc._id as string), token, expires);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Dispatch transactional email asynchronously
    emailService.sendPasswordResetEmail(userDoc.email, resetUrl).catch((err) => {
      console.error("[AUTH] Failed to send password reset email:", err);
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUTH] Password reset link for ${email}: ${resetUrl}`);
    }

    return { ...genericResponse, resetUrl };
  }

  async resetPassword(token: string, newPassword: string) {
    const userDoc = await userRepository.findByResetToken(token);
    if (!userDoc) {
      const err: any = new Error("Le jeton de réinitialisation est invalide ou a expiré.");
      err.code = "INVALID_RESET_TOKEN";
      err.statusCode = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await userRepository.updatePassword(userDoc.id || (userDoc._id as string), passwordHash);

    return { message: "Votre mot de passe a été réinitialisé avec succès." };
  }
}

export const authService = new AuthService();

