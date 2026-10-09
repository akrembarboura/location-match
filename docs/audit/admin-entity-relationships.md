# LOC MAISON — Admin Entity Relationships & Data Model Map

**Audit Date:** October 9, 2026  
**Auditor:** Senior Product Architect & Engineering Team  
**Scope:** Technical verification of Mongoose schemas, domain entities, relationships, status enums, and data integrity constraints.

---

## 1. Domain Entity Relationship Diagram

```
                              ┌────────────────┐
                              │   UserModel    │
                              │ (User Account) │
                              └───────┬────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   │ (role = OWNER)                      │ (role = CUSTOMER)
                   ▼                                     ▼
           ┌──────────────┐                     ┌──────────────────┐
           │  OwnerModel  │                     │HousingRequestModel│
           │(Owner Profile)                     │ (Rental Request) │
           └───────┬──────┘                     └────────┬─────────┘
                   │                                     │
                   │ (1 to N)                            │ (References)
                   ▼                                     │
          ┌─────────────────┐                            │
          │  PropertyModel  │◄───────────────────────────┘
          │(Property Listing│
          └────────┬────────┘
                   │
                   │ (1 to N)
                   ▼
         ┌───────────────────┐
         │ ReservationModel  │
         │   (Reservation)   │
         └─────────┬─────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────┐     ┌──────────────────┐
│Notification  │     │ ModerationEvent  │
│  Model       │     │     Model        │
└──────────────┘     └──────────────────┘
```

---

## 2. Verified Core Entities

### A. User Entity (`UserModel` / `src/lib/models/User.ts`)
- **Collection:** `users`
- **Roles:** `CUSTOMER`, `OWNER`, `ADMIN`, `SUPER_ADMIN`
- **Key Fields:** `id` (UUID), `email` (unique), `passwordHash`, `firstName`, `lastName`, `phone`, `role`, `status` (`ACTIVE`, `PENDING`, `REJECTED`), `rejectionReason`.
- **Admin Visibility:** Appears in `/admin/clients`, `/api/admin/users/[id]/reject`.

### B. Owner Entity (`OwnerModel` / `src/lib/models/Owner.ts`)
- **Collection:** `owners`
- **Key Fields:** `id`, `userId` (FK -> User), `name`, `phone`, `email`, `verified` (boolean), `status` (`ACTIVE`, `PENDING`, `REJECTED`).
- **Admin Visibility:** Appears on Property Review page (`#owner` dossier section) and overview dashboard.

### C. Property Entity (`PropertyModel` / `src/lib/models/Property.ts` & `HouseModel`)
- **Collection:** `properties` / `houses`
- **Status Enum:** `DRAFT`, `PENDING_REVIEW`, `UNDER_REVIEW`, `PUBLISHED`, `REJECTED`, `ARCHIVED`
- **Availability Status:** `AVAILABLE`, `RESERVED`
- **Rental Categories:** `summer` (nightly/weekly), `student` (monthly)
- **Key Fields:** `id`, `slug` (unique), `title`, `description`, `ownerId` (FK -> Owner/User), `city`, `area`, `address`, `pricing` (`price`, `summerPrice`, `studentPrice`, `pricePeriod`), `images` (array), `capacity` (`bedrooms`, `bathrooms`, `surface`), `amenities`, `reservation` (`from`, `to`, `updatedAt`).
- **Admin Visibility:** `/admin/properties`, `/admin/properties/[id]`, `/admin` overview grid.

### D. Housing Request Entity (`HousingRequestModel` / `src/lib/models/HousingRequest.ts`)
- **Collection:** `housing_requests`
- **Status Enum:** `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`
- **Key Fields:** `id`, `customerId` (FK -> User), `customerName`, `customerPhone`, `rentalCategory`, `destination`, `area`, `budget`, `guests`, `checkIn`, `checkOut`, `propertyId` (FK for direct reservation), `selectedPropertyDetails`, `proposedProperties` (array of matched property suggestions).
- **Admin Visibility:** `/admin/requests`, `/admin/requests/[id]`, `/admin/clients`.

### E. Reservation Entity (`ReservationModel` / `src/lib/models/Reservation.ts`)
- **Collection:** `reservations`
- **Status Enum:** `PENDING`, `CONFIRMED`, `CANCELLED`
- **Payment Status Enum:** `UNPAID`, `REPORTED`, `VERIFIED`, `REFUNDED`
- **Contact Release Control:** `contactReleased` (boolean security flag).
- **Key Fields:** `id`, `propertyId` (FK), `customerId` (FK), `ownerId` (FK), `checkIn`, `checkOut`, `amount`, `status`, `paymentStatus`, `paymentMethod` (`CASH`, `ONLINE`), `reportedAt`, `verifiedAt`, `contactReleased`.
- **Admin Visibility:** `/admin` overview KPIs, `/admin/properties/[id]#reservation`, `/api/admin/reservations`.

### F. Moderation Event Log (`ModerationEventModel` / `src/lib/models/ModerationEvent.ts`)
- **Collection:** `moderation_events`
- **Actions:** `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`, `RESERVED`, `RELEASED`
- **Key Fields:** `id`, `propertyId`, `adminId`, `action`, `previousStatus`, `newStatus`, `reason`, `createdAt`.
- **Admin Visibility:** `/admin/properties/[id]` timeline history, `/admin/activities`.

### G. Notification Entity (`NotificationModel` / `src/lib/models/Notification.ts`)
- **Collection:** `notifications`
- **Recipient Roles:** `ADMIN`, `OWNER`, `CUSTOMER`
- **Key Fields:** `id`, `type`, `title`, `message`, `propertyId`, `requestId`, `recipientRole`, `recipientId`, `read` (boolean), `createdAt`.
- **Admin Visibility:** `AdminNotificationBell` popover header, `/admin/activities`.

---

## 3. Data Integrity & Invariants

1. **Contact Information Masking:** `ReservationModel.contactReleased` remains `false` until payment status transitions to `REPORTED` (owner confirmation) or `VERIFIED` (admin audit). Unauthorized roles cannot view unreleased customer phone numbers.
2. **Double Publication Protection:** Owner properties saved as `DRAFT` or submitted as `PENDING_REVIEW` cannot be published directly by client code; status MUST transition through `propertyService.approveAdminProperty()`.
3. **Rejection Transparency:** When an admin rejects a property or owner account, a mandatory `rejectionReason` string (minimum 5 characters) is recorded in `ModerationEventModel` and stored on the target document.

