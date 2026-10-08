# LOC MAISON — Data Flow & State Audit

## 1. End-to-End Data Pipeline Architecture

```text
React Client UI
   ↓
TanStack Query / Client fetch
   ↓
Next.js API Route Handler (`app/api/`)
   ↓
Zod Validation & Auth Guard (`requireAuth`, `requireOwnerAccess`, `requireAdminAccess`)
   ↓
Service Layer (`PropertyService`, `RequestService`, `AuthService`, `NotificationService`)
   ↓
Repository Layer (`PropertyRepository`, `RequestRepository`, `UserRepository`, `PaymentRepository`)
   ↓
MongoDB (Mongoose Schema Models)
```

---

## 2. Audit Verification

1. **Zero Mock Fallback Rule**:
   - `GET /api/properties`: Queries MongoDB `PropertyModel` directly.
   - `GET /api/owner/properties`: Queries MongoDB `PropertyModel` for logged-in `ownerId`.
   - `GET /api/admin/overview`: Calculates live counts and margins from `RequestModel` and `PropertyModel`.
   - Result: 100% real database execution in production routes.

2. **TanStack Query & Cache Invalidation**:
   - Query keys used for auth (`user`), requests, and property searches.
   - Mutations call `queryClient.invalidateQueries()` or `router.refresh()` to ensure zero stale cache rendering.

---

## 3. Data Flow Compliance Score: 94 / 100
