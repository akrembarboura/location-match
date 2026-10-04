# LOC MAISON — Authentication Security

## Authentication Architecture
LOC MAISON uses a secure, stateless JWT-based authentication system. The backend validates users with `bcryptjs` and signs JSON Web Tokens (JWT) using the edge-compatible `jose` library. The entire JWT lifecycle is centralized in `src/server/config/auth.ts` and `src/server/utils/auth.ts`.

## JWT Lifecycle & Configuration
- **Payload**: Minimal by design. Contains `sub` (User ID), `role`, `email`, `iat` (issued at), and `exp` (expiration).
- **Expiration**: JWTs are strictly configured to expire in 7 days (`7d`). Validation checks `exp` securely on both API requests and Edge Middleware.
- **Verification**: Verifications explicitly enforce the `HS256` algorithm, rejecting `none` or mismatched algorithm bypass attacks.
- **Storage**: The signed JWT is stored strictly inside a secure cookie. It is never exposed in API JSON responses and never stored in `localStorage` or `sessionStorage`.

## Cookie Security
Session cookies are strictly configured with:
```typescript
{
  httpOnly: true, // Prevents XSS attacks from reading the cookie
  secure: process.env.NODE_ENV === "production", // Ensures transmission over HTTPS
  sameSite: "lax", // Prevents cross-site request forgery while maintaining UX
  path: "/",
}
```

## CSRF Strategy
The application mitigates Cross-Site Request Forgery (CSRF) organically through browser cookie security policies.
By enforcing `SameSite=lax` on the session cookie, modern browsers guarantee that the cookie is only attached to top-level navigations and same-site API requests. Cross-origin `POST`, `PUT`, `PATCH`, and `DELETE` requests will strictly omit the cookie, causing them to fail authentication. 
No explicit Anti-CSRF token is strictly necessary for this architecture unless cross-site cookie requirements change.

## Role-Based Access Control (RBAC) & Ownership
- **RBAC**: Protected routes use `requireRole(["ADMIN"])`. The role is pulled directly from the verified cryptographic JWT, never from user input or requests.
- **Ownership**: `requireOwnership(ownerId)` ensures a user only accesses their own resources. A `CUSTOMER` trying to spoof an ID, or modifying a request payload to update another's property, will fail this check. `SUPER_ADMIN` accounts possess override capabilities.

## Customer Privacy & Data Transfer Objects (DTO)
Mongoose documents frequently contain sensitive database internals (`_id`, `__v`, `passwordHash`, `resetTokens`). 
The raw documents are stripped before leaving the server using mapping functions:
- `mapUserToPrivateDTO`: Safely formats the current user's profile for their own dashboard.
- `mapUserToPublicDTO`: Safely formats limited profile attributes (e.g., first name and avatar) to display to other users (like property owners).
**Password hashes are never logged and never included in DTOs.**

## Token Revocation Limitations
Currently, logout clears the `loc_maison_session` cookie and aggressively dumps the client-side TanStack Query cache. 
*Note on revocation:* The JWT itself remains cryptographically valid until its expiration (7 days). However, because the token resides strictly in a tightly-bound HttpOnly cookie, destroying the cookie effectively terminates the session for that browser. Server-side token blacklists are not currently implemented as they add stateful requirements that break the stateless architecture.

## Testing Strategy
An automated test suite exists under `tests/auth/` verifying:
1. `jwt.test.ts`: Rejects expired, tampered, or missing claims.
2. `password.test.ts`: Asserts hashes and validates correctness.
3. `auth-api.test.ts`: Verifies registration, login, and explicit 401s.
4. `middleware.test.ts`: Confirms Next.js Edge guards reject unauthenticated or unauthorized users before execution.
5. `dto.test.ts`: Verifies DTO sanitation (e.g., no password exposure).
6. `guards.test.ts`: RBAC and Ownership matrix.

Tests run inside a safe `mongodb-memory-server` isolation layer preventing side effects on production or development databases.

