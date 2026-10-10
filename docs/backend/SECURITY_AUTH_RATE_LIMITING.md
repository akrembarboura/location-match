# 🔒 LOC MAISON — Security, Authentication & Rate Limiting Architecture

> 📌 **DOCUMENT PROPERTIES**
> - **Category**: Security Architecture, Auth Guards & Rate Limiting
> - **Stack**: JWT, bcryptjs, HMAC SHA256, MongoDB Atomic Rate Limiter
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
export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403; // Correctly maps to 403 Forbidden
  }
}

export class AuthenticationError extends Error {
  statusCode: number;
  constructor(message = "Unauthenticated") {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401; // Correctly maps to 401 Unauthorized
  }
}

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

> **Security Note:** Assigning `.statusCode` directly to these Error classes prevents generic `500 Internal Server Error` crashes in API route `catch` blocks, ensuring clean `401` and `403` HTTP responses for unauthenticated requests.

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

## 🛡️ 3. Distributed MongoDB Atomic Rate Limiter

Rate limiting is enforced at the controller layer and shared across all Vercel instances using a MongoDB-backed store (`MongoStore`). This distributed approach avoids the pitfalls of in-memory rate limiting (which can be bypassed when serverless instances scale or restart).

### Key Features:
- **Atomic Operations**: Uses `$inc` and `findOneAndUpdate` to prevent race conditions during concurrent requests.
- **Independent Limits**: We enforce distinct limits per identifier to prevent sophisticated bypasses:
  - **By IP Address**: Protects against brute-forcing from a single source (`AUTH_FORGOT_PASSWORD_IP`).
  - **By Normalized Email/Account**: Protects targeted accounts regardless of the attacker's IP (`AUTH_FORGOT_PASSWORD_ACCOUNT`).
  - **By Global Route**: Imposes overall budget constraints to prevent backend exhaustion (`PUBLIC_API`, `SEARCH`).
- **TTL Indexing**: Automatically cleans up expired rate limit buckets using MongoDB's `expireAfterSeconds` index.

```typescript
export const POLICIES = {
  AUTH_LOGIN: { name: "AUTH_LOGIN", limit: isDev ? 500 : 10, windowMs: 15 * 60 * 1000 },
  AUTH_FORGOT_PASSWORD_IP: { name: "AUTH_FORGOT_PASSWORD_IP", limit: isDev ? 500 : 20, windowMs: 15 * 60 * 1000 },
  AUTH_FORGOT_PASSWORD_ACCOUNT: { name: "AUTH_FORGOT_PASSWORD_ACCOUNT", limit: isDev ? 200 : 5, windowMs: 60 * 60 * 1000 },
  // ... other policies
};
```

---

## 📚 4. Engineering Literature References

- 📘 **Hoffman, A. (2020).** *Web Application Security*. CSRF protection, rate limiting, and session security.
- 📙 **Madden, N. (2020).** *API Security in Action*. Token-based authentication, RBAC authorization models, and API rate limiting algorithms.
