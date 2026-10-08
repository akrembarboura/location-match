# LOC MAISON — TASK 09 Admin Journey & RBAC Permissions Matrix

**File Path:** `docs/user-journeys/admin-journey.md`  
**Date:** October 8, 2026  
**Auditor & Security Architect:** Antigravity AI  

---

## 1. Complete Admin Workflow Funnel
`Login` ➔ `Dashboard` ➔ `Moderation Queue` ➔ `User Management` ➔ `Property Moderation` ➔ `Housing Requests` ➔ `Location Taxonomy` ➔ `Platform Analytics` ➔ `System Settings` ➔ `Audit Log Verification`

---

## 2. RBAC Role Hierarchy & Authorization Rules

| Role Name | Scope & Responsibilities | Key Access Capabilities |
|---|---|---|
| **`SUPER_ADMIN`** | Complete system authority & governance. | Managing admin roles, modifying system settings, destructive database purges, viewing security audit logs. |
| **`ADMIN`** | Day-to-day marketplace operational manager. | Moderating properties, unlocking customer contacts, reviewing cash payments, managing locations, managing requests. |
| **`MODERATOR`** | Content & property quality control. | Reviewing submitted property photos/text, approving/rejecting property listings, monitoring reviews. |
| **`SUPPORT`** | Customer service & issue resolution. | Viewing requests and reservations, assisting guests/owners with booking status, sending notifications. |

---

## 3. Step-by-Step Admin Workflow Breakdown

### Step 1: Secure Login (`/login`)
- **Actor:** All administrative roles (`ADMIN`, `SUPER_ADMIN`, `MODERATOR`, `SUPPORT`).
- **Action:** Authenticate with admin credentials.
- **System Response:** Issue HTTP-only JWT session cookie containing `role` claims, enforce rate limiting via `AUTH_LOGIN` policy.
- **Required RBAC:** Any valid administrative role.

---

### Step 2: Operational Dashboard (`/admin`)
- **Actor:** All administrative roles.
- **Action:** Overview of marketplace health: pending moderation queue length, total active listings, new requests today, cash payment reports pending verification.
- **System Response:** Render operational KPI widgets powered by real-time MongoDB aggregation queries.
- **Required RBAC:** All roles (`SUPPORT` sees read-only metrics; `ADMIN`/`SUPER_ADMIN` see management CTAs).

---

### Step 3: Property Moderation (`/admin/properties`)
- **Actor:** `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.
- **Action:** Inspect pending property listings in review queue (`/admin/properties?status=PENDING_REVIEW`). Review photos, pricing, amenities, and owner details.
- **Action Outcomes:**
  - **Approve:** Call `POST /api/admin/properties/[id]/approve`. Status set to `PUBLISHED`.
  - **Reject:** Call `POST /api/admin/properties/[id]/reject`. Provide mandatory rejection reason string. Status set to `REJECTED`.
  - **Archive:** Call `POST /api/admin/properties/[id]/archive`. Status set to `ARCHIVED`.
- **Required RBAC:** `MODERATOR` or higher.

---

### Step 4: Customer Contact Release & Reservation Management (`/admin/requests/[id]` & `/admin/reservations`)
- **Actor:** `ADMIN`, `SUPER_ADMIN`.
- **Action:** Override contact masking security guard (`POST /api/admin/reservations/[id]/contact-access/unlock`) when an owner needs to communicate with a confirmed guest.
- **System Response:** Record `AuditLog` entry with `actorId`, `actorRole`, and `reason`, set `contactAccessOverride.enabled: true`.
- **Required RBAC:** `ADMIN` or `SUPER_ADMIN` (`MODERATOR` and `SUPPORT` cannot release phone numbers without override audit).

---

### Step 5: Cash Payment Verification (`/admin/reservations`)
- **Actor:** `ADMIN`, `SUPER_ADMIN`.
- **Action:** Verify owner-reported cash payments (`status: REPORTED` ➔ `VERIFIED`). Validate reported deposit amount against transaction records.
- **System Response:** Update `Payment` and `Reservation.paymentSummary` records, update financial analytics ledger.
- **Required RBAC:** `ADMIN` or `SUPER_ADMIN`.

---

### Step 6: User & Owner Management (`/admin/clients` or `/api/admin/users`)
- **Actor:** `ADMIN`, `SUPER_ADMIN`.
- **Action:** View user registry, inspect owner profiles, approve owner onboarding, suspend abusive or fraudulent accounts (`status: SUSPENDED`).
- **System Response:** Update `User.status`, invalidate active JWT session cookies for suspended user.
- **Required RBAC:** `ADMIN` or `SUPER_ADMIN`.

---

### Step 7: Location Taxonomy Management (`/admin/locations`)
- **Actor:** `ADMIN`, `SUPER_ADMIN`.
- **Action:** Manage Governorates, Cities, and Areas (e.g. Mahdia Ville, Rejiche, Hiboun, Zone Touristique). Add new rental destinations without frontend code deployment.
- **System Response:** Update `Location` database models, flush destination caches.
- **Required RBAC:** `ADMIN` or `SUPER_ADMIN`.

---

### Step 8: Marketplace Analytics (`/admin/analytics`)
- **Actor:** `ADMIN`, `SUPER_ADMIN`.
- **Action:** Inspect search volume by location, zero-result search rate, conversion funnels (Search ➔ View ➔ Request ➔ Reservation ➔ Payment), supply/demand ratio.
- **System Response:** Query `AnalyticsEventModel` aggregations over 7/30/90 days.
- **Required RBAC:** `ADMIN` or `SUPER_ADMIN`.

---

### Step 9: System Settings & Platform Configuration (`/admin/settings`)
- **Actor:** `SUPER_ADMIN` ONLY.
- **Action:** Modify platform commission fees, global rate limiting thresholds, image upload constraints, and external integrations (Cloudinary keys, SMS gateways).
- **System Response:** Persist configuration changes in system environment/config store.
- **Required RBAC:** `SUPER_ADMIN` exclusively.

---

### Step 10: Security Audit Log Inspection (`/admin/audit-logs`)
- **Actor:** `SUPER_ADMIN` ONLY.
- **Action:** Audit all administrative state changes, contact unmasking events, account suspensions, and property status overrides.
- **System Response:** Render immutable paginated audit log from `AuditLogModel`.
- **Required RBAC:** `SUPER_ADMIN` exclusively.
