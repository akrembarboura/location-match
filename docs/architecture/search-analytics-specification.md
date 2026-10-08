# LOC MAISON — TASK 16 Search Analytics Specification & Identity Contract

**File Path:** `docs/architecture/search-analytics-specification.md`  
**Date:** October 8, 2026  
**Auditor & Data Architect:** Antigravity AI  

---

## 1. Search Identity & Lifecycle Attribution

To answer *"Which search query led to which property view, request, and reservation?"*, every search action generates a unique, stable `searchId`.

```text
  [ User Device / Browser ]
             │
      sessionId (UUID string stored in sessionStorage)
             │
             ├── searchId A (UUID generated on search submit)
             │      ├── SEARCH_SUBMITTED (searchId: A)
             │      ├── RESULTS_RETURNED (searchId: A, resultCount: 14)
             │      ├── PROPERTY_CARD_CLICKED (searchId: A, propertyId: "PROP-101")
             │      └── PROPERTY_VIEWED (searchId: A, propertyId: "PROP-101")
             │
             └── searchId B (UUID generated when user updates filters)
                    ├── SEARCH_SUBMITTED (searchId: B)
                    └── RESULTS_RETURNED (searchId: B, resultCount: 0) ──► ZERO_RESULTS_LOGGED
```

---

## 2. Event Payload Schema Specifications

### 2.1 `SEARCH_SUBMITTED` Event Payload

```ts
export interface SearchSubmittedEventPayload {
  eventName: "search_submitted";
  searchId: string;           // SRCH-UUID
  sessionId: string;          // SESS-UUID
  anonymousId: string;        // ANON-UUID
  userId?: string;            // Authenticated user ID (if logged in)
  actorType: "ANONYMOUS" | "CUSTOMER" | "OWNER" | "ADMIN";
  search: {
    destination?: string;
    city?: string;
    area?: string;
    checkIn?: string;         // YYYY-MM-DD
    checkOut?: string;        // YYYY-MM-DD
    guests?: number;
    rentalCategory?: "summer" | "student";
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    amenities?: string[];
  };
  context: {
    source: "HOME" | "SEARCH_PAGE" | "PROPERTY_PAGE" | "DIRECT";
    device: "MOBILE" | "TABLET" | "DESKTOP";
  };
  occurredAt: Date;
}
```

---

### 2.2 `SEARCH_RESULTS_RETURNED` Event Payload

```ts
export interface SearchResultsReturnedEventPayload {
  eventName: "search_results_returned";
  searchId: string;
  sessionId: string;
  anonymousId: string;
  userId?: string;
  results: {
    resultCount: number;      // 0 triggers zero-result metrics
    page: number;
    limit: number;
    hasMore: boolean;
    returnedPropertyIds: string[]; // Top 10 property IDs on current page
  };
  latencyMs: number;          // Server API execution time in ms
  occurredAt: Date;
}
```

---

### 2.3 `PROPERTY_CARD_CLICKED` Event Payload

```ts
export interface PropertyCardClickedEventPayload {
  eventName: "property_card_clicked";
  searchId: string;           // Links click to originating searchId
  sessionId: string;
  anonymousId: string;
  userId?: string;
  propertyId: string;
  positionIndex: number;      // Card position in search result list (0-indexed)
  occurredAt: Date;
}
```

---

## 3. Server vs Client Event Ownership & Reliability

| Event Name | Generator | Ownership | Reliability / Deduplication |
|---|---|---|---|
| `SEARCH_STARTED` | Client | Browser JS | Debounced (500ms) on search input focus |
| `SEARCH_SUBMITTED` | Client | Browser JS | Triggered on form submit click |
| `SEARCH_RESULTS_RETURNED` | Server API | `GET /api/properties` | Logged server-side in API route handler |
| `PROPERTY_CARD_CLICKED` | Client | Browser JS | Triggered on card navigation click |
| `PROPERTY_VIEWED` | Server / Client | Property detail page | Logged on page mount with `searchId` from URL query |

---

## 4. Privacy, Sanitization & Retention Rules

- ❌ **No Sensitive PII:** Passwords, payment card info, and exact street numbers are excluded.
- ✅ **Hashed IP Addresses:** Client IP is used solely for rate limiting and coarse geolocation (City level), then discarded.
- ✅ **Retention Policy:** Behavioral events in `AnalyticsEventModel` carry a 90-day MongoDB TTL index (`expireAfterSeconds: 7776000`).
