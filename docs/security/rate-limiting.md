# Rate Limiting

## 1. Why Rate Limiting Exists
Rate limiting is a foundational security and abuse-prevention layer. It protects Loc Maison from:
- Credential stuffing and brute-force login attempts
- Automated scraping of properties and destinations
- Request storms (accidental or intentional) that could degrade performance
- Resource exhaustion on expensive endpoints (e.g. search queries)

**Note:** Rate limiting is an *additional* protection mechanism. It does NOT replace JWT authentication or Role-Based Access Control (RBAC).

## 2. Production Storage Architecture
To ensure rate limiting works reliably across horizontal scaling (e.g., Vercel, multiple Node.js instances), an in-memory `Map` is insufficient. 
The application implements a central abstraction (`RateLimitStore`) that delegates to a **MongoDB-backed store** (`MongoStore`) by default.
MongoDB uses `findOneAndUpdate` with a TTL index to ensure counters expire automatically without background cleanup processes.
For local testing or CI pipelines, a deterministic test-safe `MemoryStore` is available.

## 3. Rate-Limit Policies
Policies are centralized in `src/server/rate-limit/policies.ts` instead of scattered magic numbers. Initial policies include:
- `AUTH_LOGIN`: 10 requests / 15 minutes
- `AUTH_REGISTER`: 5 requests / hour
- `PUBLIC_API`: 120 requests / minute
- `SEARCH`: 60 requests / minute
- `AUTHENTICATED_API`: 120 requests / minute
- `MUTATION`: 30 requests / minute
- `ADMIN_API`: 120 requests / minute

These can be dynamically configured via environment variables or adjusted in code as needed.

## 4. Key Generation
The rate limiter generates string keys using the format `rate-limit:{scope}:{identity}` to isolate counters.
- Unauthenticated requests use the client's IP.
- Login requests use IP + normalized (lowercased) email to prevent distributed brute-forcing while also isolating users on shared IPs.
- Authenticated requests use the verified JWT user ID (`userId`).

## 5. IP Handling
Client IP extraction is centralized in `src/server/utils/client-ip.ts`. It prefers trusted proxy headers like `x-forwarded-for` (common on Vercel) or `x-real-ip` over the native request IP. Care must be taken at the infrastructure edge to strip spoofed headers if the application is not behind a trusted proxy.

## 6. Authenticated-User Handling
Authenticated routes extract the user ID strictly from the server-verified JWT token. Client-provided `userId`s (whether in the URL, query, or body) are never trusted for rate limiting identity, preventing trivial bypasses.

## 7. 429 Response Behavior
When a limit is exceeded, the API returns a consistent JSON format:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```
Internal infrastructure details, Redis/Mongo errors, and stack traces are never exposed.

## 8. Retry-After Behavior
Rate-limited responses include standard HTTP headers:
- `Retry-After`: The number of seconds until the current window resets.
- `X-RateLimit-Limit`: The total limit for the policy.
- `X-RateLimit-Remaining`: Remaining capacity.
- `X-RateLimit-Reset`: Absolute timestamp of the reset.

## 9. Fail-Open/Fail-Closed Strategy
If the backend store (MongoDB) is temporarily unavailable:
- **Sensitive endpoints** (e.g. `AUTH_LOGIN`, `AUTH_REGISTER`, `ADMIN_API`) **Fail-Closed**. They will reject requests to prevent security bypasses.
- **Non-sensitive endpoints** (e.g. `PUBLIC_API`, `SEARCH`) **Fail-Open**. They will allow requests to maintain core browsing availability.

## 10. Testing Strategy
A comprehensive suite of Vitest tests covers:
- Key generation (including email normalization)
- IP extraction logic
- Core limiter boundaries (limit enforcement, window expiration)
- API Integration (simulating full HTTP cycles using real Route Handlers and Mock NextRequests)
Testing relies on `mongodb-memory-server` ensuring no production stores are touched during CI.

## 11. Deployment Requirements
- Ensure MongoDB is reachable. The `RateLimit` collection requires a TTL index (`expireAfterSeconds: 0`), which the Mongoose schema automatically creates on startup.
- If migrating to Redis later, implement a `RedisStore` satisfying the `RateLimitStore` interface and update `index.ts`.

## 12. How to Adjust Limits Safely
Modify the thresholds in `policies.ts`. Changes apply instantly to new rate-limit windows. Wait for old windows to expire automatically. Do not manually clear the store unless absolutely necessary.
