# LOC MAISON — Phase 1 System Architecture Audit

**File Path:** `docs/architecture/current-state.md`  
**Date:** October 8, 2026  
**Auditor:** Antigravity AI  

---

## 1. Directory & Codebase Structure

```
location_match/
├── app/                              # Next.js 15 App Router pages & API routes
│   ├── (auth pages)                  # /login, /register
│   ├── admin/                        # Admin dashboard & management interfaces
│   ├── owner/                        # Owner management dashboard & property submission
│   ├── houses/ & properties/         # Customer search, detail, and browsing views
│   ├── request/                      # Customer housing request workflows
│   └── api/                          # Next.js Serverless API endpoints
│       ├── admin/                    # Admin management endpoints
│       ├── analytics/                # Event tracking endpoint
│       ├── auth/                     # Authentication endpoints
│       ├── customer/                 # Customer reservation endpoints
│       ├── owner/                    # Owner property & reservation management
│       ├── properties/               # Public property search & detail APIs
│       └── requests/                 # Customer request APIs
├── src/
│   ├── components/                   # React UI Components
│   │   ├── admin/                    # Admin management components & navigation
│   │   ├── owner/                    # Owner form wizards & property tables
│   │   ├── rentals/                  # Rental property detail & search UI
│   │   ├── site/                     # Public headers, footers, shells
│   │   └── ui/                       # Reusable primitives (Shadcn/ui)
│   ├── hooks/                        # Custom React hooks (e.g. useMobile)
│   ├── lib/                          # Shared utilities, client APIs, schemas
│   │   ├── analytics/                # Client-side analytics tracking & consent
│   │   ├── auth/                     # Client auth API, DTOs, form schemas
│   │   ├── i18n/                     # French translation dictionaries
│   │   ├── pricing/                  # Pricing calculator helpers
│   │   ├── rentals/                  # Rental API client & request schemas
│   │   ├── models.ts                 # Mongoose schema definitions
│   │   ├── mongoose.ts               # Database connection singleton
│   │   └── roles.ts                  # Role taxonomy (CUSTOMER, OWNER, ADMIN)
│   └── server/                       # Server-only domain architecture
│       ├── analytics/                # Analytics service & repository
│       ├── config/                   # Server config (JWT, auth constants)
│       ├── dtos/                     # Data Transfer Objects
│       ├── pricing/                  # Server-side pricing engine
│       ├── rate-limit/               # MongoDB-backed rate limiter
│       ├── repositories/             # Data access abstraction layer
│       ├── services/                 # Domain business logic services
│       ├── utils/                    # Auth guards, cookies, Cloudinary
│       └── validations/              # Zod validation schemas
└── tests/                            # Vitest integration test suite
```

---

## 2. Domain Boundaries & Responsibilities

| Domain | Key Files / Location | Primary Responsibilities |
|---|---|---|
| **Auth & Security** | `src/server/services/AuthService.ts`<br>`src/server/utils/auth-guards.ts`<br>`src/server/utils/session-cookie.ts` | Handles password hashing (bcrypt), JWT cookie creation/verification, role enforcement (CUSTOMER, OWNER, ADMIN), account status guards. |
| **Properties** | `src/server/services/PropertyService.ts`<br>`src/server/repositories/PropertyRepository.ts` | Manages property drafts, review submissions, admin verification (approval/rejection), search filtering, categories, and public availability. |
| **Housing Requests** | `src/server/services/RequestService.ts`<br>`src/server/repositories/RequestRepository.ts` | Processes summer/student request submissions, Tunisian phone normalization, owner proposal generation, and request state tracking. |
| **Reservations** | `src/server/repositories/ReservationRepository.ts`<br>`src/server/services/ContactReleasePolicy.ts` | Handles property reservations, date range collision checks, customer masking, and conditional phone number unmasking for owners. |
| **Payments** | `src/server/repositories/PaymentRepository.ts` | Manages cash confirmation lifecycle (`UNPAID` -> `REPORTED` -> `VERIFIED`) linked with reservation records. |
| **Notifications** | `src/server/services/NotificationService.ts` | Asynchronously generates in-app notifications for Admins and Owners on critical lifecycle state changes. |
| **Analytics** | `src/server/analytics/AnalyticsService.ts`<br>`src/server/analytics/AnalyticsRepository.ts` | Validates, sanitizes, and records product usage events (`PAGE_VIEW`, `SEARCH_SUBMITTED`, `PROPERTY_VIEWED`, etc.). |
| **Rate Limiting** | `src/server/rate-limit/` | Enforces rate limits per IP and per authenticated user stored in MongoDB `rate_limits` collection. |
| **Media Management** | `src/server/utils/cloudinary.ts`<br>`app/api/owner/properties/upload/sign/` | Generates secure Cloudinary upload signatures for direct client-to-cloud asset uploads. |

---

## 3. Server Architecture Overview

### Repositories (`src/server/repositories/`)
- **`UserRepository`**: Performs MongoDB queries for User lookup by ID/Email, user creation, role updates, and rejection status updates.
- **`PropertyRepository`**: Handles full text search, category filters, owner property listings, moderation status transitions, and price queries.
- **`RequestRepository`**: Stores and retrieves customer rental requests and owner proposals.
- **`ReservationRepository`**: Handles reservation creation, date overlap checks, and status updates.
- **`PaymentRepository`**: Interacts with reservation payment metadata for cash verification.

### Services (`src/server/services/`)
- **`AuthService`**: Encapsulates login authentication, password security, session issue, and owner onboarding approval logic.
- **`PropertyService`**: Enforces business rules around property lifecycle transitions (`DRAFT` -> `PENDING_REVIEW` -> `PUBLISHED` / `REJECTED`).
- **`RequestService`**: Validates Tunisian national phone format (`+216 XX XXX XXX`), normalizes phone numbers, and manages request lifecycle.
- **`NotificationService`**: Provides structured notification dispatching for system events.
- **`OwnerDashboardService`**: Aggregates real-time stats (properties count, pending requests, active reservations, unread notifications) for logged-in owners.
- **`ContactReleasePolicy`**: Security guard governing when customer contact details are revealed to property owners.

---

## 4. Cross-Cutting Concerns

### Authentication & Middleware
- Session tokens are signed HS256 JWTs saved in an HTTP-only `session_token` cookie.
- Edge `middleware.ts` inspects requests to `/admin/*`, `/owner/*`, and `/dashboard/*`, redirecting unauthenticated or unauthorized users to `/login`.
- Server-side route handlers use `requireUser(req)`, `requireOwner(req)`, or `requireAdmin(req)` guards from `src/server/utils/auth-guards.ts`.

### Validation & Error Handling
- Zod schemas validate request payloads across all API routes (`src/server/validations/`).
- Standardized API errors are returned using `OwnerApiError` or standard structured JSON responses (`{ error: string, code?: string }`).

### TanStack Query Integration
- Wrapped in `app/components/Providers.tsx` (`QueryClientProvider`).
- Used on client pages for fetching properties, owner dashboard status, and client request management with auto-invalidation.

---

## 5. Audit Conclusions & Next Steps

1. **Model Fragmentation:** Currently, all Mongoose models reside in a single file (`src/lib/models.ts`). In Phase 2, models will be audited and split into domain-focused models (`src/server/models/`).
2. **Missing Core Models:** Categories, Locations (Governorate/City/Area), Audit Logs, and Payment Transactions require explicit Mongoose models to support future marketplace scale.
3. **Domain Lifecycle Alignment:** Property, Request, Reservation, and Payment lifecycles must be formalized into explicit state machines (Phases 2 & 3).
