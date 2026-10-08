# LOC MAISON — Phase 3 Domain Lifecycle Specifications

**File Path:** `docs/architecture/domain-lifecycles.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. TASK 03 — Property State Machine & Lifecycle

### 1.1 Property State Diagram
```
  [ DRAFT ]
      │ (Owner Submits)
      ▼
[ SUBMITTED / PENDING_REVIEW ] ──── (Admin Rejects) ───► [ REJECTED ]
      │                                                     │
      │ (Admin Approves)                                    │ (Owner Resubmits)
      ▼                                                     │
 [ APPROVED / ACTIVE ] ◄────────────────────────────────────┘
      │          ▲
(Owner│          │ (Owner
Pauses│          │ Resumes)
      ▼          │
  [ PAUSED ] ────┘
      │
(Admin/│
Owner  │
Archive)▼
 [ ARCHIVED ]
```

### 1.2 Transition Matrix & Rules

| Current State | Target State | Actor / Role | API Route | Generated Notification | Generated Analytics Event | Owner View | Admin View |
|---|---|---|---|---|---|---|---|
| `-` | `DRAFT` | Owner | `POST /api/owner/properties` | - | `property_created` | Draft saved, incomplete listing badge | Not visible in public review queue |
| `DRAFT` | `PENDING_REVIEW` | Owner | `POST /api/owner/properties/[id]/submit` | `PROPERTY_SUBMITTED` -> Admin | `property_submitted` | "En attente de validation" badge | Appears in moderation queue |
| `PENDING_REVIEW` | `APPROVED` (`PUBLISHED`) | Admin | `POST /api/admin/properties/[id]/approve` | `PROPERTY_APPROVED` -> Owner | `property_approved` | "Publiée / Active" with public link | Listed as Approved & Published |
| `PENDING_REVIEW` | `REJECTED` | Admin | `POST /api/admin/properties/[id]/reject` | `PROPERTY_REJECTED` -> Owner (includes reason) | `property_rejected` | "Refusée" badge with feedback & Edit CTA | Marked as Rejected with audit history |
| `REJECTED` | `PENDING_REVIEW` | Owner | `POST /api/owner/properties/[id]/submit` | `PROPERTY_SUBMITTED` -> Admin | `property_resubmitted` | "Correction soumise" badge | Re-enters moderation queue with change notes |
| `PUBLISHED` | `PAUSED` | Owner | `PATCH /api/owner/properties/[id]` (`status: PAUSED`) | - | `property_paused` | "Masquée temporairement" badge | Visible as Paused |
| `PAUSED` | `PUBLISHED` | Owner | `PATCH /api/owner/properties/[id]` (`status: PUBLISHED`) | - | `property_resumed` | "Publiée / Active" badge | Listed as Active |
| Any | `ARCHIVED` | Owner / Admin | `POST /api/admin/properties/[id]/archive` | - | `property_archived` | Archived (read-only) | Marked as Archived |

---

## 2. TASK 04 — Rental Request State Machine & Lifecycle

### 2.1 Housing Request State Diagram
```
  [ DRAFT ]
      │ (Customer Submits Inquiry)
      ▼
 [ SUBMITTED / PENDING ] ──── (Admin/Owner Rejects) ───► [ REJECTED ]
      │
      │ (Owner Proposal Sent)
      ▼
[ PENDING_OWNER / PROPOSAL_SENT ]
      │
      ├── (Customer Accepts) ───► [ ACCEPTED ] ───► (Reservation Created) ───► [ RESERVED ]
      │
      ├── (Customer Declines / Cancelled) ───► [ CANCELLED ]
      │
      └── (Timer Exceeds 48h) ───► [ EXPIRED ]
```

### 2.2 Roles & Lifecycle Actions
- **Customer Actions:**
  - Submit request (`POST /api/requests`): initializes `SUBMITTED` / `PENDING` request.
  - Accept proposal (`POST /api/requests/[id]/proposal` with `action: "ACCEPT"`): transitions to `ACCEPTED`, triggering reservation draft creation.
  - Cancel request (`POST /api/requests/[id]` with `action: "CANCEL"`): transitions to `CANCELLED`.
- **Owner Actions:**
  - Respond to request (`POST /api/owner/reservations` or proposal endpoint): proposes matching property and dates.
  - Decline request: marks proposal `REJECTED`.
- **Admin Intervention:**
  - Override customer contact access (`POST /api/admin/reservations/[id]/contact-access/unlock`): explicitly unlocks masked customer phone numbers for verified owners.
  - Reject invalid or spam requests (`POST /api/admin/requests/[id]`): transitions status to `REJECTED`.
- **Notifications Dispatch:**
  - On `SUBMITTED`: `NEW_REQUEST` notification to Admin.
  - On `PROPOSAL_SENT`: Notification to Customer (SMS / Email / In-app).
  - On `ACCEPTED`: `PROPOSAL_ACCEPTED` notification to Owner & Admin.
- **Analytics Events:** `request_started`, `request_submitted`, `proposal_created`, `proposal_accepted`, `proposal_rejected`.

---

## 3. TASK 05 — Reservation State Machine & Lifecycle

### 3.1 Reservation State Diagram
```
 [ PENDING ] ──── (Payment Reported / Confirmed) ───► [ CONFIRMED ]
      │                                                     │
      ├── (Cancelled by Guest/Owner) ──► [ CANCELLED ]      │ (Check-in Date Reached)
      │                                                     ▼
      └── (Unpaid Expiry 24h) ─────────► [ EXPIRED ]     [ ACTIVE ]
                                                            │ (Check-out Date Passed)
                                                            ▼
                                                       [ COMPLETED ]
```

### 3.2 Rules & Availability Conflict Constraints
1. **Ownership & Date Locking:**
   - A `CONFIRMED` or `ACTIVE` reservation locks the date range `[checkIn, checkOut]` for the associated property.
   - Any overlapping attempt to confirm a new reservation for the same property within `[checkIn, checkOut]` MUST be blocked at database/service level with `409 Conflict`.
2. **Cancellation Rules:**
   - Customer cancellation > 7 days prior to check-in: Full deposit refund eligible.
   - Customer cancellation < 48 hours: Deposit non-refundable.
   - Owner cancellation: Requires Admin notification, auto-flags property for moderation review.

---

## 4. TASK 06 — Payment State Machine & Lifecycle

### 4.1 Payment State Diagram
```
 [ INITIATED ]
       │ (Owner/Customer Reports Payment)
       ▼
  [ PENDING ] ──────────► [ REPORTED ]
       │                        │
       │ (Transaction Failure)  │ (Admin/System Verifies Receipt)
       ▼                        ▼
  [ FAILED ]              [ VERIFIED / SUCCEEDED ]
                                │
                                │ (Refund Issued)
                                ▼
                           [ REFUNDED ]
```

### 4.2 System Rules & Financial Security
- **Golden Rule:** Payment status MUST BE derived strictly from verified database transactions (`PaymentRepository`), NOT from client-side analytics events or unverified UI states.
- **Cash Confirmation Flow:**
  1. Customer reserves property (`Payment.status: PENDING`, `amount: X TND`).
  2. Owner receives cash on-site or via deposit and clicks "Confirm Cash Receipt" (`POST /api/owner/reservations/[id]/report-cash`). Status updates to `REPORTED`.
  3. Admin verifies transaction or system auto-reconciles -> Status becomes `VERIFIED` / `SUCCEEDED`.
- **Payment Methods Supported:** `CASH`, `BANK_TRANSFER`, `D17`, `ONLINE`.

