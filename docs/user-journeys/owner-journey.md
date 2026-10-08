# LOC MAISON — TASK 08 Owner Journey Mapping

**File Path:** `docs/user-journeys/owner-journey.md`  
**Date:** October 8, 2026  
**Auditor & Product Designer:** Antigravity AI  

---

## Complete Owner Funnel
`Register` ➔ `Owner Onboarding` ➔ `Create Property` ➔ `Upload Images` ➔ `Submit for Review` ➔ `Admin Approval` ➔ `Publish` ➔ `Receive Request` ➔ `Respond` ➔ `Reservation Management` ➔ `Property Maintenance` ➔ `Performance Analytics`

---

## Detailed Step-by-Step Breakdown

### Step 1: Owner Registration (`/register?role=OWNER`)
- **User Goal:** Create a host account to list rental properties on LOC MAISON.
- **User Action:** Provide email, password, full name, phone number, select "Propriétaire".
- **System Response:** Create `User` record (`role: OWNER`, `status: ACTIVE`/`PENDING`), set session cookie.
- **Potential Friction:** Confusing role toggle, strict password strength errors without clear UI feedback.
- **Data Collected:** `email`, `passwordHash`, `role: "OWNER"`, `firstName`, `lastName`, `phone`.
- **Analytics Event:** `OWNER_SIGNUP_STARTED`, `OWNER_SIGNUP_COMPLETED`.
- **Success Condition:** User logged in with `OWNER` role cookie and redirected to owner dashboard onboarding.
- **Failure Condition:** Duplicate email error (`409 Conflict`) or validation failure.

---

### Step 2: Owner Onboarding (`/owner` or `/api/owner/onboard`)
- **User Goal:** Verify phone number, complete profile details, and learn how listing works.
- **User Action:** Confirm profile info, enter primary operating area (e.g. Mahdia Zone Touristique).
- **System Response:** Save onboarding details, render owner onboarding wizard banner and empty properties state.
- **Potential Friction:** Forced identity verification steps that stall listing creation.
- **Data Collected:** `phone`, `operatingArea`, `identityVerified`.
- **Analytics Event:** `OWNER_ONBOARDING_COMPLETED`.
- **Success Condition:** Owner profile active and "Ajouter une propriété" CTA prominently displayed.
- **Failure Condition:** Account rejected during initial background validation.

---

### Step 3: Create Property Wizard (`/owner/properties/new` or `/owner/list-property`)
- **User Goal:** Fill out property attributes (title, description, location, rental category: Summer/Student, price per night/week, capacity, amenities).
- **User Action:** Complete property creation steps and save draft.
- **System Response:** Save `Property` record (`status: DRAFT`, `ownerId: user.id`), assign unique ID & slug.
- **Potential Friction:** Losing form data when navigating between steps, vague amenity options.
- **Data Collected:** `title`, `description`, `rentalCategory`, `location`, `pricing`, `capacity`, `amenities`.
- **Analytics Event:** `PROPERTY_CREATION_STARTED`, `PROPERTY_CREATED` (`status: "DRAFT"`).
- **Success Condition:** Property saved as `DRAFT` in database and visible in `/owner/properties`.
- **Failure Condition:** Validation failure on required pricing or capacity fields.

---

### Step 4: Upload Images (`/owner/properties/[id]/edit`)
- **User Goal:** Upload high-resolution photos of the house/apartment, set cover image, and arrange photo order.
- **User Action:** Select images from device, drag to reorder, set primary cover.
- **System Response:** Request Cloudinary upload signature (`POST /api/owner/properties/upload/sign`), upload binary directly to Cloudinary, append asset metadata to `Property.images` array.
- **Potential Friction:** Large file upload timeouts, failed signatures, missing upload progress indicator.
- **Data Collected:** Asset URL, Cloudinary `publicId`, `sortOrder`, image dimensions (`width`, `height`).
- **Analytics Event:** `PROPERTY_IMAGE_UPLOADED`.
- **Success Condition:** All uploaded images displayed in thumbnail gallery with reordering handles.
- **Failure Condition:** Image exceeds max file size limit (e.g., > 10MB) or Cloudinary signature rejects request.

---

### Step 5: Submit Property for Moderation (`/api/owner/properties/[id]/submit`)
- **User Goal:** Send finished property draft to LOC MAISON admin team for verification and publication.
- **User Action:** Click "Soumettre pour validation".
- **System Response:** Transition property status from `DRAFT` to `PENDING_REVIEW`, dispatch `PROPERTY_SUBMITTED` notification to Admin queue.
- **Potential Friction:** Button disabled without indicating missing requirements (e.g., minimum 3 photos required).
- **Data Collected:** `submittedAt`, `previousStatus: "DRAFT"`, `newStatus: "PENDING_REVIEW"`.
- **Analytics Event:** `PROPERTY_SUBMITTED`.
- **Success Condition:** Status badge updates to "En attente de validation" and email notification sent to Admin.
- **Failure Condition:** Submission rejected by pre-flight validation (e.g. missing cover photo).

---

### Step 6: Admin Approval & Publication
- **User Goal:** Receive admin verification greenlight and have listing visible to searchers.
- **User Action:** Await review (or respond to revision feedback if rejected).
- **System Response:** Admin reviews listing via `/admin/properties/[id]`. On approval, property transitions to `PUBLISHED` (`isPublished: true`, `verified: true`), sending `PROPERTY_APPROVED` notification to owner.
- **Potential Friction:** Long review turnaround without status updates.
- **Data Collected:** `reviewedAt`, `reviewedBy`, `moderationStatus`.
- **Analytics Event:** `PROPERTY_APPROVED` (or `PROPERTY_REJECTED`).
- **Success Condition:** Property status changes to `PUBLISHED` and listing appears live on `/properties`.
- **Failure Condition:** Property rejected due to incomplete description or invalid photos.

---

### Step 7: Receive Customer Request (`/owner/requests`)
- **User Goal:** Receive incoming customer rental inquiries matching owner's property.
- **User Action:** View request notification in owner portal, inspect dates, guest count, and budget.
- **System Response:** Render request card with masked customer phone number until confirmation.
- **Potential Friction:** Unread notifications buried in UI, delayed SMS/Email alerts.
- **Data Collected:** `requestId`, `viewedAt`.
- **Analytics Event:** `OWNER_REQUEST_VIEWED`.
- **Success Condition:** Owner reviews request details within 24 hours.
- **Failure Condition:** Request expires unanswered (`EXPIRED`).

---

### Step 8: Respond to Request / Proposal (`/api/owner/reservations`)
- **User Goal:** Accept request, propose pricing terms, or decline request.
- **User Action:** Click "Accepter" or "Envoyer une proposition", input price and terms.
- **System Response:** Generate proposal record, update request state (`PROPERTY_PROPOSED`), notify customer.
- **Potential Friction:** Inflexible price adjustment fields.
- **Data Collected:** `proposedPrice`, `checkIn`, `checkOut`, `terms`.
- **Analytics Event:** `OWNER_REQUEST_RESPONDED`.
- **Success Condition:** Proposal sent to customer and status updated.
- **Failure Condition:** Date collision with an existing reservation.

---

### Step 9: Reservation & Cash Reporting (`/owner/reservations`)
- **User Goal:** Manage active bookings, view check-in schedules, and record cash payments received.
- **User Action:** Review guest check-in date, unmask contact details, click "Confirmer la réception de paiement cash" upon receiving cash.
- **System Response:** Unmask customer phone via `ContactReleasePolicy`, transition payment status (`UNPAID` ➔ `REPORTED`), notify Admin.
- **Potential Friction:** Ambiguity over payment status confirmation.
- **Data Collected:** `reservationId`, `reportedAmount`, `reportedAt`.
- **Analytics Event:** `OWNER_CASH_REPORTED`.
- **Success Condition:** Cash report logged, reservation marked active/paid.
- **Failure Condition:** Customer cancels or double booking conflict occurs.

---

### Step 10: Property Availability & Calendar Maintenance (`/owner/calendar`)
- **User Goal:** Block off-season dates, update seasonal pricing, or pause property listing.
- **User Action:** Toggle calendar availability dates, adjust price per night/week, toggle `PAUSED` state.
- **System Response:** Update `Property.unavailable` date ranges and pricing schema in DB.
- **Potential Friction:** Calendar UI glitching on mobile touch screens.
- **Data Collected:** `unavailable` date ranges, updated pricing rules.
- **Analytics Event:** `CALENDAR_UPDATED`, `PRICING_UPDATED`.
- **Success Condition:** Unavailable dates blocked from public search calendar.
- **Failure Condition:** DB write fails or pricing validation rejects range.

---

### Step 11: Performance Analytics (`/owner/page.tsx`)
- **User Goal:** Monitor total property views, request conversion rate, confirmed bookings, and projected revenue.
- **User Action:** View owner dashboard summary cards and chart breakdowns.
- **System Response:** Query `OwnerDashboardService`, calculate real-time stats from database collections.
- **Potential Friction:** Displaying unverified/fake placeholder metrics instead of actual DB aggregations.
- **Data Collected:** Aggregated views, request counts, revenue totals.
- **Analytics Event:** `OWNER_DASHBOARD_VIEWED`.
- **Success Condition:** Accurate metrics rendered showing performance trends over 30 days.
- **Failure Condition:** Dashboard API timeout or zero data error.
