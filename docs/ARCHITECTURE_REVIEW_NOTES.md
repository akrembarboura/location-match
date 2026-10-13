# Architecture & Documentation Review Notes

**Date:** 2026-10-10
**Reviewer:** Senior Staff Software Engineer / Technical Auditor
**Scope:** Review of `docs/` architectural documentation (11 files) for LOC MAISON.

---

## 1. Architecture Strengths

- **Strict Clean Architecture Layering**: The explicit separation of Next.js route handlers, Domain Services, and Mongoose Repositories is an excellent defense against monolithic API rot. This prevents query logic from leaking into controllers.
- **Advanced State Management**: The use of a Guarded Finite State Machine (Stage A → Stage F) to manage multi-step reservation workflows strictly prevents illegal transaction states.
- **Dynamic Policy Engine**: The Strategy Pattern implemented in `CommissionPolicyService.ts` for cascading commission rates is elegant, extensible, and properly separates business rules from data retrieval.
- **Modern Edge-Ready Authentication**: Utilizing `jose` for stateless JWT validation perfectly aligns with Next.js Edge Runtime constraints.
- **Consistent UI/UX Engineering**: The frontend architecture enforces an Atomic Design system combined with standardized async state containers (`AsyncStateContainer`), promoting DRY client patterns and robust suspense boundary handling.

## 2. Potential Weaknesses & Security Concerns

- **Financial Floating-Point Math**: The `CommissionPolicyService.ts` relies on native JS math (`Math.round(...) / 1000`) for currency rounding. While it attempts to handle millimes correctly, IEEE 754 precision issues can still cause drift on edge cases. 
- **Stateless JWT Revocation Limits**: The architecture uses a sliding 7-day JWT without refresh tokens. The docs mention that checking `passwordChangedAt` against `iat` to invalidate tokens is "optional". This is a security risk—if a token is compromised, a 7-day lifetime without a mandatory revocation mechanism (denylist or timestamp validation) is too long.
- **Serverless Connection Pooling Limits**: While caching the Mongoose connection with `maxPoolSize: 10` helps, extreme concurrency in a Vercel serverless environment can still lead to MongoDB Atlas socket exhaustion before Phase 2 (Redis/Connection Proxy) is implemented.
- **FSM Transactional Atomicity**: The FSM transitions (e.g., Stage D to E) often involve updating multiple documents (Reservation status, Payment Ledgers). The docs do not explicitly detail the use of MongoDB multi-document ACID transactions (`session.withTransaction`). Without this, transient network failures during transitions could result in orphaned data.

## 3. Inconsistencies & Missing Technical Details

- **Queue Roadmap in Serverless**: `DATABASE_INDEXING_AND_SCALE.md` outlines adding BullMQ for background jobs. However, BullMQ requires a persistent Node.js process and Redis. Standard Vercel Serverless environments terminate quickly and are poorly suited for persistent BullMQ workers. The architectural gap of where these workers will be hosted (e.g., AWS EC2, Render, Heroku) is missing.
- **Next.js App Router vs. TanStack Query**: The UI docs highlight TanStack query for data fetching. Next.js 15 strongly encourages React Server Components (RSC) and Server Actions for data fetching and mutations. The documentation doesn't clarify the boundary of when to use RSC vs. Client-side TanStack Query fetching.

## 4. Actionable Suggestions for Improvement

1. **Introduce a Currency Library**: Refactor `CommissionPolicyService` and other financial logic to use `dinero.js` or `currency.js` to completely eliminate floating-point arithmetic risks.
2. **Enforce JWT Revocation Verification**: Make the `passwordChangedAt` validation mandatory in the `requireAuth` guard. Consider implementing an emergency `revokedTokens` Redis set in Phase 2.
3. **Document ACID Transaction Boundaries**: Update `SERVICES_AND_REPOSITORIES.md` to demonstrate how the Repository layer handles MongoDB `ClientSession` passing to ensure FSM transitions are 100% atomic.
4. **Clarify Background Job Hosting**: Revisit the BullMQ roadmap to explicitly define the infrastructure requirements (e.g., separating the worker tier from the Next.js UI/API tier) or consider serverless-friendly queues like Inngest or Upstash QStash.
5. **Define RSC vs. Client Fetching Boundaries**: Add a section in `UI_FLOWS_AND_STATE.md` detailing exact heuristics for when developers should use Server Components vs. TanStack Query (e.g., "Use RSC for SEO-critical initial loads, use React Query for authenticated dashboards and mutations").

