# LOC MAISON — Admin Route Inventory

**Audit Date:** October 9, 2026  
**Auditor:** Senior Product Architect & Engineering Team  
**Scope:** Complete inspection of `app/admin` pages, nested routes, and administrative API endpoints.

---

## 1. Summary of Admin Routes

The LOC MAISON administration architecture consists of **8 distinct user-facing page routes** and **20 specialized administrative API endpoints**. Access control is strictly enforced at the API level via `requireRole(["ADMIN", "SUPER_ADMIN"])` and guarded on the client side through session verification in `AdminShell`.

---

## 2. Page Route Inventory

| Route | Page Name / Purpose | Source File Path | Navigation Location | Access Control | Page Status | Key Dependencies | Key Findings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin` | Overview Dashboard & Marketplace Operations Console | `app/admin/page.tsx` | Sidebar (`Vue d'ensemble`) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/overview`, `AdminShell`, `AsyncStateContainer` | Database-first pagination & lean queries implemented. Zero hardcoded KPI counts. |
| `/admin/requests` | Rental Request Management Queue | `app/admin/requests/page.tsx` | Sidebar (`Demandes`) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/requests`, `HousingRequestModel` | Supports tab filtering (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`) and client search. |
| `/admin/requests/[id]` | Request Details & Proposal Builder | `app/admin/requests/[id]/page.tsx` | Sub-route (Link from requests list) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/requests/[id]`, `/api/admin/requests/[id]/proposals` | Enables matching proposed properties, updating request status, and contract PDF generation. |
| `/admin/clients` | Client Contacts & Lead Directory | `app/admin/clients/page.tsx` | Sidebar (`Clients`) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/requests`, `LoadingThreeDotsJumping` | Aggregates client contacts from housing requests with filters for direct reservations vs general searches. |
| `/admin/properties` | Property Moderation & Verification Catalog | `app/admin/properties/page.tsx` | Sidebar (`Biens`) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/properties`, `PropertyModel`, `HouseModel` | Server-side paginated inventory grid with status tab filtering (`PENDING_REVIEW`, `PUBLISHED`, etc.). |
| `/admin/properties/[id]` | Property Review, Verification & Analytics | `app/admin/properties/[id]/page.tsx` | Sub-route (Link from property cards) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/properties/[id]`, `/api/admin/properties/[id]/analytics` | Multi-section page with anchor scrolling (`#owner`, `#reservation`, `#analytics`), moderation timeline & metrics. |
| `/admin/analytics` | Marketplace Traffic & Conversion Performance | `app/admin/analytics/page.tsx` | Sidebar (`Statistiques`) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/analytics`, `AnalyticsRepository`, `AnalyticsService` | Real-time funnel metrics (Visitors, Searches, Views, Requests, Proposals, Reservations) across 7d/30d/90d/all. |
| `/admin/activities` | Administrative Activity & Audit Trail | `app/admin/activities/page.tsx` | Sidebar (`Activités`) | `ADMIN`, `SUPER_ADMIN` | Verified Working | `/api/admin/activities`, `ModerationEventModel`, `NotificationModel` | Live stream of platform notifications, moderation actions, and user submission events. |

---

## 3. Administrative API Endpoints Inventory

| Endpoint | Method | Purpose | Source File | Auth Guard | Rate Limit | Collection / Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/admin/overview` | `GET` | Aggregates high-level KPIs, urgency counts, distributions, and top properties | `app/api/admin/overview/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `HousingRequestModel`, `ReservationModel`, `OwnerModel` |
| `/api/admin/requests` | `GET` | Retrieves paginated/filtered list of housing requests | `app/api/admin/requests/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `HousingRequestModel`, `UserModel` |
| `/api/admin/requests/[id]` | `GET`, `PATCH` | Retrieves request detail or updates status/stage | `app/api/admin/requests/[id]/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `HousingRequestModel`, `PropertyModel` |
| `/api/admin/requests/[id]/proposals` | `POST` | Adds or updates proposed properties for a request | `app/api/admin/requests/[id]/proposals/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `HousingRequestModel` |
| `/api/admin/properties` | `GET` | Retrieves paginated property catalog for moderation | `app/api/admin/properties/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `HouseModel`, `OwnerModel` |
| `/api/admin/properties/[id]` | `GET` | Fetches single property record with owner & moderation history | `app/api/admin/properties/[id]/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `OwnerModel`, `ModerationEventModel` |
| `/api/admin/properties/[id]/review` | `POST` | Marks property status as `UNDER_REVIEW` | `app/api/admin/properties/[id]/review/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `ModerationEventModel` |
| `/api/admin/properties/[id]/approve` | `POST` | Validates property and publishes it (`PUBLISHED`) | `app/api/admin/properties/[id]/approve/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `ModerationEventModel`, `NotificationModel` |
| `/api/admin/properties/[id]/reject` | `POST` | Rejects property publication with mandatory reason | `app/api/admin/properties/[id]/reject/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `ModerationEventModel`, `NotificationModel` |
| `/api/admin/properties/[id]/archive` | `POST` | Archives a property listing (`ARCHIVED`) | `app/api/admin/properties/[id]/archive/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `ModerationEventModel` |
| `/api/admin/properties/[id]/reservation` | `POST`, `DELETE` | Creates/updates or releases a property reservation | `app/api/admin/properties/[id]/reservation/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `PropertyModel`, `ReservationModel`, `ModerationEventModel` |
| `/api/admin/properties/[id]/analytics` | `GET` | Fetches performance metrics for a specific property | `app/api/admin/properties/[id]/analytics/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `AnalyticsEventModel`, `HousingRequestModel` |
| `/api/admin/analytics` | `GET` | Calculates overall platform funnel, visitor stats, and demand vs supply | `app/api/admin/analytics/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `AnalyticsEventModel`, `HousingRequestModel`, `PropertyModel` |
| `/api/admin/activities` | `GET` | Fetches administrative activity log and moderation events | `app/api/admin/activities/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `ModerationEventModel`, `NotificationModel` |
| `/api/admin/notifications` | `GET` | Fetches unread admin notifications list and count | `app/api/admin/notifications/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `NotificationModel` |
| `/api/admin/notifications/[id]/read` | `POST` | Marks a specific notification as read | `app/api/admin/notifications/[id]/read/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `NotificationModel` |
| `/api/admin/reservations` | `GET` | Retrieves all platform reservations and payment records | `app/api/admin/reservations/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `ReservationModel` |
| `/api/admin/reservations/[id]/contact-access/unlock` | `POST` | Unlocks customer contact details for owner/admin | `app/api/admin/reservations/[id]/contact-access/unlock/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `ReservationModel` |
| `/api/admin/reservations/[id]/contact-access/relock` | `POST` | Re-locks customer contact details for owner/admin | `app/api/admin/reservations/[id]/contact-access/relock/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `ReservationModel` |
| `/api/admin/users/[id]/reject` | `POST` | Rejects an owner account application with reason | `app/api/admin/users/[id]/reject/route.ts` | `ADMIN`, `SUPER_ADMIN` | `POLICIES.ADMIN_API` | `UserModel`, `OwnerModel` |

---

## 4. Key Routing Findings & Recommendations

1. **Route Integrity:** All 8 admin page routes exist in the filesystem and map 1-to-1 to existing subdirectories under `app/admin/`.
2. **Hidden Routes:** `/admin/requests/[id]` and `/admin/properties/[id]` operate as dedicated detail and action pages accessible via record links.
3. **Sidebar Consistency:** Navigation links in `AdminShell` accurately reflect active routes using `usePathname()`.
4. **Layout Architecture:** Admin shell relies on local page wrapping `<AdminShell>` with fixed sticky positioning (`top-0 h-screen`), preventing double sidebar rendering and double layout mounting.

