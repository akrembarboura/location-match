import { userRepository } from "../repositories/UserRepository";
import type { LoginInput, RegisterInput } from "../validations/auth";
import { mapUserToPrivateDTO } from "../dtos/user";
import { signJwtToken, getSession } from "../utils/auth";
import { setSessionCookie, deleteSessionCookie } from "../utils/session-cookie";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);
    
    const newId = crypto.randomUUID();

    // Force CUSTOMER role for registration to prevent privilege escalation via API
    // (A real app might read allowed roles or strictly default to CUSTOMER here)
    const assignedRole = "CUSTOMER";

    const userDoc = await userRepository.create({
      id: newId,
      email: input.email,
      passwordHash,
      role: assignedRole,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    });

    const dto = mapUserToPrivateDTO(userDoc);
    const token = await signJwtToken({ sub: dto.id, role: dto.role as any, email: dto.email });
    await setSessionCookie(token);
    return dto;
  }

  async login(input: LoginInput) {
    const userDoc = await userRepository.findByEmail(input.email);
    if (!userDoc) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, userDoc.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
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

    return mapUserToPrivateDTO(userDoc);
  }
}

export const authService = new AuthService();

