# LOC MAISON — TASK 10 Analytics Strategy & Event Taxonomy

**File Path:** `docs/analytics/event-taxonomy.md`  
**Date:** October 8, 2026  
**Auditor & Data Architect:** Antigravity AI  

---

## 1. Event Payload Standard Schema

Every analytics event in LOC MAISON MUST adhere to the following unified schema:

```ts
interface AnalyticsEventPayload {
  eventName: string;         // Unique event name from taxonomy enum
  actor: {
    type: "ANONYMOUS" | "CUSTOMER" | "OWNER" | "ADMIN";
    userId?: string;         // Present if authenticated
    role?: string;
  };
  timestamp: string;         // ISO 8601 UTC timestamp
  sessionId: string;         // Anonymous or session tracking UUID
  anonymousId?: string;      // Persistent device/browser ID cookie
  entityId?: string;         // Primary entity associated with event (propertyId, requestId, reservationId)
  metadata: Record<string, unknown>; // Event-specific contextual key-value attributes
}
```

---

## 2. Product Event Taxonomy

### 2.1 Customer Behavioral Events (Client & Server Instrumented)

| Event Name | Trigger Condition | Primary `entityId` | Key Metadata Attributes |
|---|---|---|---|
| `PAGE_VIEW` | Client route change | - | `path`, `title`, `referrer` |
| `SEARCH_STARTED` | User focuses or enters query in search bar | - | `rentalCategory` |
| `SEARCH_SUBMITTED` | Search query executed | - | `city`, `governorate`, `checkIn`, `checkOut`, `guests`, `resultCount` |
| `FILTER_APPLIED` | Search filter modified | - | `filterName`, `filterValue`, `resultCount` |
| `PROPERTY_VIEWED` | Customer views property detail page | `propertyId` | `city`, `rentalCategory`, `price`, `ownerId` |
| `PROPERTY_IMAGE_OPENED` | Customer expands photo lightbox | `propertyId` | `imageIndex`, `totalImages` |
| `PROPERTY_FAVORITED` | Customer clicks heart icon | `propertyId` | `isFavorited: true` |
| `CONTACT_OWNER_CLICKED` | Customer clicks "Contacter Hôte" | `propertyId` | `ownerId`, `contactReleased` |
| `REQUEST_STARTED` | Customer opens housing request wizard | `propertyId` | `rentalCategory` |
| `REQUEST_SUBMITTED` | Customer submits housing request | `requestId` | `propertyId`, `rentalCategory`, `guests`, `budget` |

---

### 2.2 Owner Operational Events (Server & Client Instrumented)

| Event Name | Trigger Condition | Primary `entityId` | Key Metadata Attributes |
|---|---|---|---|
| `OWNER_ONBOARDING_STARTED` | Owner opens onboarding flow | `userId` | `operatingArea` |
| `PROPERTY_CREATION_STARTED` | Owner clicks "Nouvelle propriété" | - | - |
| `PROPERTY_CREATED` | Property draft saved | `propertyId` | `rentalCategory`, `propertyType`, `status: "DRAFT"` |
| `PROPERTY_SUBMITTED` | Property sent for moderation | `propertyId` | `imageCount`, `pricing` |
| `PROPERTY_IMAGE_UPLOADED` | Owner uploads photo to Cloudinary | `propertyId` | `publicId`, `sortOrder` |
| `PROPERTY_UPDATED` | Owner edits property details | `propertyId` | `changedFields` |
| `OWNER_REQUEST_VIEWED` | Owner opens incoming request | `requestId` | `propertyId` |
| `OWNER_REQUEST_RESPONDED` | Owner sends proposal or accepts request | `requestId` | `propertyId`, `proposedPrice`, `action` |

---

### 2.3 Transactional & Financial Business Events (Server-Side Strictly Instrumented)

| Event Name | Trigger Condition | Primary `entityId` | Key Metadata Attributes |
|---|---|---|---|
| `RESERVATION_CREATED` | Booking created in DB | `reservationId` | `propertyId`, `ownerId`, `customerId`, `totalPrice` |
| `RESERVATION_CONFIRMED` | Calendar locked & booking confirmed | `reservationId` | `propertyId`, `checkIn`, `checkOut` |
| `RESERVATION_CANCELLED` | Booking cancelled | `reservationId` | `cancelledBy`, `reason` |
| `PAYMENT_INITIATED` | Cash/Transfer payment recorded | `paymentId` | `reservationId`, `amount`, `method` |
| `PAYMENT_SUCCEEDED` | Cash reported or verified | `paymentId` | `reservationId`, `verifiedAmount`, `verifiedBy` |
| `PAYMENT_FAILED` | Transaction fails or rejected | `paymentId` | `reservationId`, `failureReason` |
| `PAYMENT_REFUNDED` | Refund issued | `paymentId` | `reservationId`, `refundAmount` |

---

### 2.4 Administrative & Moderation Events (Server-Side Only)

| Event Name | Trigger Condition | Primary `entityId` | Key Metadata Attributes |
|---|---|---|---|
| `PROPERTY_APPROVED` | Admin approves property listing | `propertyId` | `adminId`, `previousStatus` |
| `PROPERTY_REJECTED` | Admin rejects property listing | `propertyId` | `adminId`, `rejectionReason` |
| `USER_SUSPENDED` | Admin suspends user account | `userId` | `adminId`, `reason` |

---

## 3. Privacy & Data Protection Rules
- ❌ **NEVER TRACK:** Passwords, password hashes, payment card numbers, bank account numbers, exact street address numbers of unreserved properties.
- ✅ **ANONYMIZATION:** IP addresses are hashed before log persistence.
- ✅ **RETENTION:** Raw behavioral events expire automatically after 90 days via MongoDB TTL index.
