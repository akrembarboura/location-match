# 🔒 LOC MAISON — Security, Authentication & Rate Limiting Architecture

> 📌 **DOCUMENT PROPERTIES**
> - **Category**: Security Architecture, Auth Guards & Rate Limiting
> - **Stack**: JWT, bcryptjs, HMAC SHA256, Sliding Window Rate Limiter
> - **Authoritative Literature References**:
>   - 📚 *OAuth 2.0 in Action* by Justin Richer & Antonio Sanso
>   - 📚 *Web Application Security: Exploitation and Countermeasures* by Andrew Hoffman
>   - 📚 *API Security in Action* by Neil Madden

---

## 📌 Executive Summary

This document specifies the security architecture of LOC MAISON, including multi-role JWT session management, RBAC access guards, OTP HMAC verification, constant-time timing attack protection, and token bucket rate limiting.

---

## 🔒 1. Multi-Role Authorization Guard Matrix (RBAC)

```typescript
export type Role = "CUSTOMER" | "OWNER" | "ADMIN" | "SUPER_ADMIN";

export async function requireAuth() {
  const user = await authService.getCurrentUser();
  if (!user) throw new AuthenticationError("Authentification requise.");
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as Role)) {
    throw new AuthorizationError(`Droits insuffisants. Rôles autorisés: ${allowedRoles.join(", ")}`);
  }
  return user;
}
```

### Authorization Matrix

| Action / Resource | CUSTOMER | OWNER | ADMIN | SUPER_ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| Browse Listings & Submit Rental Requests | ✅ | ✅ | ✅ | ✅ |
| Create & Manage Owned Listings | ❌ | ✅ | ✅ | ✅ |
| Negotiate & Record Commission Payments | ❌ | ❌ | ✅ | ✅ |
| Modify Platform Default Rates & Policies | ❌ | ❌ | ❌ | ✅ |

---

## 🔑 2. OTP Security & Constant-Time Hashing

To prevent timing side-channel attacks during password reset lookup, non-existent email requests execute dummy HMAC computations:

```typescript
import crypto from "crypto";

export function computeOTPHmac(challengeId: string, userId: string, otp: string): string {
  const secret = process.env.OTP_HMAC_SECRET || "fallback-dev-secret-key";
  return crypto
    .createHmac("sha256", secret)
    .update(`${challengeId}:${userId}:${otp}`)
    .digest("hex");
}
```

---

## 🛡️ 3. Sliding Window Token Bucket Rate Limiter

Rate limiting is enforced at the controller layer to defend against brute-force attacks and DDOS:

```typescript
export const RATE_LIMIT_POLICIES = {
  AUTH_LOGIN: { windowMs: 15 * 60 * 1000, max: 5, failClosed: true },    // 5 attempts per 15 min
  CUSTOMER_SUBMIT: { windowMs: 60 * 60 * 1000, max: 3, failClosed: false }, // 3 requests per hour
  PUBLIC_SEARCH: { windowMs: 60 * 1000, max: 60, failClosed: false },     // 60 searches per min
};
```

---

## 📚 4. Engineering Literature References

- 📘 **Hoffman, A. (2020).** *Web Application Security*. CSRF protection, rate limiting, and session security.
- 📙 **Madden, N. (2020).** *API Security in Action*. Token-based authentication, RBAC authorization models, and API rate limiting algorithms.
