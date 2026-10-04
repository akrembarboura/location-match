import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/lib/models";
import { AUTH_CONFIG } from "../config/auth";
import { getSessionCookie } from "./session-cookie";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error("The environment variable JWT_SECRET is not set.");
  }
  return new TextEncoder().encode(secret);
};

export interface AuthJwtPayload {
  sub: string;
  role: Role;
  email: string;
  iat?: number;
  exp?: number;
}

export async function signJwtToken(payload: Omit<AuthJwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: AUTH_CONFIG.JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.JWT_EXPIRES_IN)
    .sign(getJwtSecretKey());
}

export async function verifyJwtToken(token: string): Promise<AuthJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
    });
    
    // Explicitly validate required claims
    if (!payload.sub || !payload.role || !payload.email || !payload.exp) {
      return null;
    }

    return payload as unknown as AuthJwtPayload;
  } catch (error) {
    return null; // covers expired, malformed, invalid signature
  }
}

export async function getSession(): Promise<AuthJwtPayload | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  return await verifyJwtToken(token);
}

