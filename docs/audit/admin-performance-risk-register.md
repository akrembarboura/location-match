# LOC MAISON — Admin Performance & Risk Register

**Audit Date:** October 9, 2026  
**Auditor:** Senior Product Architect & Engineering Team  
**Scope:** Exhaustive evaluation of security, performance, data integrity, rate limiting, and runtime operational risks across the admin ecosystem.

---

## 1. Risk Matrix Overview

| Risk ID | Category | Severity | Description & Evidence | File Location | Recommended Remediation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RISK-01** | UI/UX Layout | Low | Double layout wrapper if page and layout both instantiate `AdminShell` | `app/admin/layout.tsx` | Ensure `AdminShell` is instantiated strictly once per page/layout boundary | **Resolved** |
| **RISK-02** | Security Guard | Medium | Ensure all admin APIs enforce `requireRole(["ADMIN", "SUPER_ADMIN"])` | `app/api/admin/**/*.ts` | Audited: 100% of admin API routes enforce role guards | **Verified Safe** |
| **RISK-03** | Rate Limiting | Low | Prevent brute-force / DOS on admin endpoints | `server/rate-limit/policies.ts` | Enforce `POLICIES.ADMIN_API` key check on all admin API handlers | **Verified Safe** |
| **RISK-04** | Database Query | Medium | Unbounded queries returning full collection without limit | `app/api/admin/overview/route.ts` | Applied `.select(...)`, `.lean()`, and explicit `.limit()` or Mongo `$count` | **Resolved** |
| **RISK-05** | Contact Privacy | High | Unauthorized exposure of customer phone numbers before payment confirmation | `server/services/ReservationService.ts` | Enforce `contactReleased` invariant: phone numbers remain masked until `REPORTED`/`VERIFIED` | **Verified Safe** |
| **RISK-06** | Data Integrity | High | Owner attempting to bypass admin review to set status=`PUBLISHED` | `server/services/PropertyService.ts` | Restrict `status` mutation: `PUBLISHED` can only be set via `approveAdminProperty` | **Verified Safe** |
| **RISK-07** | Moderation Audit | Low | Rejections missing clear explanation for owner | `app/admin/properties/[id]/page.tsx` | Require minimum 5-character explicit `rejectionReason` in rejection modal | **Verified Safe** |

---

## 2. Comprehensive Security & Permission Audit

### Role & Permission Checks
- Every administrative API endpoint under `app/api/admin/` imports `requireRole` from `@/server/utils/auth-guards`.
- If an unauthenticated user or customer attempts to invoke an admin route, the API immediately returns HTTP 401 Unauthorized or HTTP 403 Forbidden.
- Unit tests in `tests/auth/guards.test.ts` and `tests/properties/owner-property-workflow.test.ts` explicitly verify that customer tokens cannot access admin endpoints.

### Rate Limiting Controls
- Admin API calls are governed by `POLICIES.ADMIN_API` in `src/server/rate-limit/policies.ts`.
- Public search and analytics events are governed by `POLICIES.SEARCH` and `POLICIES.ANALYTICS_EVENT` to prevent API starvation.

---

## 3. Database & Performance Audit

1. **Projection Hygiene:** All admin endpoints query MongoDB using `.select(...)` to fetch only required fields (e.g. `id title price city coverImage status createdAt`).
2. **Execution Hygiene:** All read-only database queries use `.lean()` to bypass Mongoose document hydration overhead.
3. **Count Performance:** Aggregations use native MongoDB operations (`countDocuments()`, `$group`, `$match`) rather than fetching arrays and calling `.length` in JavaScript.

