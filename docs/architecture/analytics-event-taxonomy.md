# LOC MAISON — Complete Analytics Event Taxonomy & Attribution Reference

**File Path:** `docs/architecture/analytics-event-taxonomy.md`  
**Date:** October 8, 2026  
**Auditor & Data Architect:** Antigravity AI  

---

## 1. Complete Event Enum Taxonomy

```ts
export const ANALYTICS_EVENT_NAMES = [
  // Search & Discovery Funnel
  "search_started",
  "search_submitted",
  "search_results_returned",
  "property_card_clicked",
  "property_viewed",
  "property_image_opened",
  "property_favorited",
  "property_unfavorited",
  "contact_owner_clicked",

  // Customer Request & Booking Funnel
  "request_started",
  "request_submitted",
  "proposal_created",
  "proposal_accepted",
  "proposal_rejected",
  "reservation_confirmed",
  "reservation_released",

  // Owner Operations
  "owner_cta_clicked",
  "owner_signup_started",
  "owner_signup_completed",
  "property_created",
  "property_submitted",
  "property_approved",
  "property_rejected",

  // Financial & Administrative
  "payment_initiated",
  "payment_succeeded",
  "payment_failed",
  "payment_refunded",
  "user_suspended"
] as const;
```

---

## 2. Anonymous-to-Authenticated Session Association

When an anonymous visitor logs in or registers:
1. `anonymousId` (stored in persistent cookie `loc_anon_id`) remains linked to all prior events.
2. Newly created `userId` is stamped on all subsequent event payloads.
3. Database queries aggregate visitor funnels by linking `{ $or: [{ userId }, { anonymousId }] }`.

---

## 3. Search Funnel Event Mapping Matrix

```text
               SEARCH_STARTED (Client)
                          │
                          ▼
              SEARCH_SUBMITTED (Client)
                          │
                          ▼
           SEARCH_RESULTS_RETURNED (Server)
                          │
                          ▼
            PROPERTY_CARD_CLICKED (Client)
                          │
                          ▼
               PROPERTY_VIEWED (Server)
                          │
                          ▼
            CONTACT_OWNER_CLICKED (Client)
                          │
                          ▼
              REQUEST_SUBMITTED (Server)
                          │
                          ▼
            RESERVATION_CONFIRMED (Server)
                          │
                          ▼
              PAYMENT_SUCCEEDED (Server)
```
