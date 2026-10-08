# LOC MAISON — Phase 2 MongoDB Data Model & Domain Audit

**File Path:** `docs/architecture/database-model.md`  
**Date:** October 8, 2026  
**Auditor:** Antigravity AI  

---

## 1. Executive Summary & Model Overview

The current database architecture uses MongoDB with Mongoose ODM. Models are currently co-located in `src/lib/models.ts`. This document audits the existing 15 domain models, identifies schema gaps, unifies duplicate structures (e.g. `HouseModel` vs `PropertyModel`), and outlines the proposed target data model for full marketplace scalability.

---

## 2. Comprehensive Model Audits

### 2.1 User Model (`User`)
- **Purpose:** Represents authenticated application actors (Customers, Owners, Admins, Super Admins).
- **Relationships:** 1:1 with `Owner` (if `role === 'OWNER'`), 1:N with `Property` (owner), 1:N with `HousingRequest` (customer), 1:N with `Reservation`.
- **Required Fields:** `email`, `passwordHash`
- **Optional Fields:** `id` (UUID string), `firstName`, `lastName`, `phone`, `avatar`
- **Status Fields:** `status` (`ACTIVE`, `PENDING`, `REJECTED`, `SUSPENDED`, `DISABLED`)
- **Indexes:** `email` (unique), `status` (index)
- **Ownership:** Self-owned; status transitions controlled by `ADMIN`.
- **Problems & Gaps:**
  - `id` field (string) exists alongside Mongoose `_id`. Should standardize on a single consistent identifier format across all models.
  - Lack of email verification timestamp or phone verification status.

---

### 2.2 Owner Model (`Owner`)
- **Purpose:** Legacy profile record for property owners.
- **Relationships:** Links to `User` via `userId`.
- **Required Fields:** `id`
- **Optional Fields:** `userId`, `name`, `phone`, `area`, `properties`, `since`
- **Status Fields:** None directly (uses `User.status`).
- **Indexes:** `id` (unique)
- **Problems & Gaps:**
  - Redundant with `User` model when `User.role === 'OWNER'`.
  - Properties count is stored as a static integer instead of calculated dynamically from `PropertyModel`.
  - **Proposed Action:** Merge owner attributes into `User` or formalize `OwnerProfile` subdocument.

---

### 2.3 Property Model (`Property`)
- **Purpose:** Core marketplace inventory entity representing rental properties (Summer & Student).
- **Relationships:** Belongs to `User` (`ownerId`), 1:N with `PropertyModerationEvent`, 1:N with `Reservation`.
- **Required Fields:** `id`, `title`
- **Optional Fields:** `slug`, `ownerId`, `description`, `rentalCategory`, `propertyType`, `features`, `categoryIds`, `location`, `pricing`, `capacity`, `amenities`, `images`, `coverImageId`, `availability`, `status`
- **Pricing Breakdown:**
  - `pricing.price`: Base price amount.
  - `pricing.pricePeriod`: `"night" | "week" | "month"`.
  - `pricing.currency`: `"TND"`.
  - Legacy fields: `summerPrice`, `studentPrice`, `pricePerNight`.
- **Availability Breakdown:**
  - `availabilityStatus`: `"AVAILABLE" | "RESERVED"`.
  - `unavailable`: Array of `{ from: string, to: string }`.
  - `reservation`: Embedded active reservation details.
- **Image Structure:** Array of `{ id, url, publicId, alt, sortOrder, width, height }`.
- **Status Fields:** `status` (`DRAFT`, `PENDING_REVIEW`, `UNDER_REVIEW`, `PUBLISHED`, `REJECTED`, `ARCHIVED`)
- **Indexes:**
  - `{ status: 1, city: 1, rentalCategory: 1 }`
  - `{ ownerId: 1, createdAt: -1 }`
  - `{ availabilityStatus: 1, "reservation.from": 1, "reservation.to": 1 }`
- **Problems & Gaps:**
  - **Schema Duplication:** Legacy `HouseModel` exists alongside `PropertyModel`. `HouseModel` must be deprecated and migrated to `PropertyModel`.
  - Redundant flat fields (`city`, `governorate`, `guests`, `bedrooms`, `pricePerNight`) exist alongside structured subdocuments (`location`, `capacity`, `pricing`).
  - Missing dynamic pricing rules (seasonal surge pricing, minimum stay constraints).

---

### 2.4 Location Hierarchy (`Location` & `Destination`)
- **Current State:** Hardcoded in `DestinationModel` and inline in `Property.location`.
- **Proposed Standalone Models:**
  - `Governorate` (e.g. Mahdia, Monastir, Sousse, Hammamet)
  - `City` (e.g. Mahdia Ville, Rejiche, Hiboun)
  - `Area` / Zone (e.g. Zone Touristique, Corniche)
- **Relationships:** Governorate -> 1:N -> City -> 1:N -> Area.
- **Required Fields:** `code`, `name`, `slug`, `parentRef`
- **Purpose:** Eliminates hardcoded location strings in frontend & backend search.

---

### 2.5 Category Model (`Category`)
- **Purpose:** Property classification taxonomy (Type: Apartment, Villa; Rental Category: Summer, Student; Features: Sea View, Pool).
- **Relationships:** Referenced by `Property.categoryIds`.
- **Required Fields:** `id`, `label`
- **Optional Fields:** `slug`, `rentalCategory`, `icon`
- **Problems & Gaps:** Missing hierarchy/grouping (e.g. distinguishing Property Type vs Amenity vs Feature).

---

### 2.6 Housing Request Model (`HousingRequest`)
- **Purpose:** Customer inquiries for rental accommodations.
- **Relationships:** Belongs to `User` (`customerId`), 1:N with proposals (`proposedProperties`), 1:1 with `Reservation` (on conversion).
- **Required Fields:** `id`
- **Optional Fields:** `customerId`, `customer.fullName`, `customer.phone`, `rentalCategory`, `destination`, `area`, `checkIn`, `checkOut`, `guests`, `budget`, `university`, `genderPreference`, `status`, `proposedProperties`, `selectedProperty`
- **Status Fields:** `status` (`PENDING`, `UNDER_REVIEW`, `PROPERTY_PROPOSED`, `CLIENT_CONFIRMATION`, `CONFIRMED`, `COMPLETED`, `REJECTED`, `CANCELLED`)
- **Problems & Gaps:**
  - `budget` has mixed types (`Schema.Types.Mixed`) due to legacy string vs number values. Needs strict numerical schema.
  - Legacy fields (`kind`, `people`, `period`, `stage`, `submitted`) present for compatibility.

---

### 2.7 Reservation Model (`Reservation`)
- **Purpose:** Confirmed booking between Customer and Owner for a Property.
- **Relationships:** Belongs to `Property` (`propertyId`), `Owner` (`ownerId`), `User` (`customerId`), optional link to `HousingRequest` (`requestId`).
- **Required Fields:** `id`, `propertyId`, `ownerId`, `customerName`, `checkIn`, `checkOut`
- **Status Fields:** `status` (`CONFIRMED`, `COMPLETED`, `CANCELLED`)
- **Payment Summary Subdocument:**
  - `paidAmount`, `reportedAmount`, `remainingAmount`
  - `status`: `"UNPAID" | "REPORTED" | "PARTIALLY_PAID" | "PAID" | "REFUNDED"`
- **Indexes:** `requestId`, `propertyId`, `ownerId`, `customerId`, `checkIn`, `checkOut`, `paymentSummary.status`
- **Problems & Gaps:** `PENDING` state is missing from main reservation status enum (currently defaults to `CONFIRMED`).

---

### 2.8 Payment Model (`Payment`)
- **Purpose:** Tracks financial transactions, owner cash reports, and admin verifications.
- **Relationships:** Belongs to `Reservation` (`reservationId`), `Property` (`propertyId`), `Owner` (`ownerId`), `User` (`customerId`).
- **Required Fields:** `id`, `reservationId`, `propertyId`, `ownerId`, `amount`
- **Status Fields:** `status` (`PENDING`, `REPORTED`, `VERIFIED`, `REJECTED`, `REFUNDED`, `CONFIRMED`)
- **Method Enum:** `"CASH" | "BANK_TRANSFER" | "D17" | "ONLINE" | "OTHER"`
- **Problems & Gaps:** Verification needs exact transaction receipt uploads (Cloudinary reference) for bank transfers/D17.

---

### 2.9 Notification Model (`Notification`)
- **Purpose:** In-app notification queue for Admins and Owners.
- **Required Fields:** `id`, `title`, `message`
- **Type Enum:** `NEW_REQUEST`, `STATUS_CHANGE`, `PROPOSAL_ACCEPTED`, `PROPOSAL_REJECTED`, `PROPERTY_SUBMITTED`, `PROPERTY_APPROVED`, `PROPERTY_REJECTED`, `SYSTEM`
- **Status Fields:** `read` (`boolean`)
- **Problems & Gaps:** Customer notifications are missing (currently defaults `recipientRole` to `ADMIN`).

---

### 2.10 Analytics Event Model (`AnalyticsEvent`)
- **Purpose:** Product usage tracking & conversion funnel data.
- **Required Fields:** `id`, `eventName`, `occurredAt`
- **Status Fields:** N/A (immutable event log)
- **Indexes:** Includes 90-day TTL index on `occurredAt`.
- **Gaps:** Session attribution needs consistent `sessionId` & `anonymousId` passing from client.

---

### 2.11 Audit Log & Moderation Models (`AuditLog` & `PropertyModerationEvent`)
- **Purpose:** Immutable security audit trailing for administrative and owner actions.
- **Audit Log Fields:** `id`, `action`, `actorId`, `actorRole`, `targetType`, `targetId`, `reason`, `details`, `occurredAt`
- **Moderation Event Fields:** `id`, `propertyId`, `adminId`, `action`, `previousStatus`, `newStatus`, `reason`

---

### 2.12 Proposed New Models (Gaps Identified)
1. **`Favorite` Model:**
   - Fields: `id`, `userId`, `propertyId`, `createdAt`
   - Purpose: Enables customer favorite list management.
2. **`Review` Model:**
   - Fields: `id`, `reservationId`, `propertyId`, `customerId`, `rating`, `comment`, `status`, `createdAt`
   - Purpose: Marketplace trust & property ratings.
3. **`Message` Model:**
   - Fields: `id`, `requestId` / `reservationId`, `senderId`, `recipientId`, `content`, `readAt`, `createdAt`
   - Purpose: Direct Customer-Owner communication channel.

---

## 3. Current vs Proposed Database Schema Comparison

```
CURRENT DATA MODEL                      PROPOSED TARGET MODEL
------------------                      ---------------------
src/lib/models.ts (All-in-one file)  -> Split into domain files: src/server/models/
  - User                                -> User (Enhanced profile, roles)
  - House (Legacy duplicate)           -> DEPRECATED (Migrated into Property)
  - Property                           -> Property (Normalized location & pricing subdocs)
  - Owner                              -> MERGED into User profile
  - Category                           -> Category (Hierarchical taxonomy)
  - Destination                        -> Location (Governorate -> City -> Area hierarchy)
  - HousingRequest                     -> HousingRequest (Cleaned budget schema & stages)
  - Reservation                        -> Reservation (Added PENDING lifecycle status)
  - Payment                            -> Payment (Added receipt proofs)
  - Notification                       -> Notification (Added CUSTOMER recipient role)
  - AnalyticsEvent                     -> AnalyticsEvent (Standardized event taxonomy)
  - AuditLog                           -> AuditLog
  - PropertyModerationEvent            -> PropertyModerationEvent
  - [Missing]                          -> Favorite (NEW)
  - [Missing]                          -> Review (NEW)
  - [Missing]                          -> Message (NEW)
```

