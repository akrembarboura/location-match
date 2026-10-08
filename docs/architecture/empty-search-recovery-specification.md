# LOC MAISON — TASK 17 Empty Search Result Recovery Specification

**File Path:** `docs/architecture/empty-search-recovery-specification.md`  
**Date:** October 8, 2026  
**Auditor & Protocol Designer:** Antigravity AI  

---

## 1. Executive Protocol Summary

A zero-result search MUST NOT be a dead end in LOC MAISON. When a search yields `resultCount === 0`, the system automatically classifies the root failure cause, generates a ranked list of deterministic constraint-relaxation options, presents actionable recovery choices, and links the user's selection to a new recovery `searchId` for conversion attribution.

---

## 2. Recovery Pipeline & Identity Lifecycle

```text
               User Executes Search (searchId: SRCH-100)
                                   │
                                   ▼
                   MongoDB Query returns 0 Results
                                   │
                                   ▼
                   Classify Zero-Result Failure Reason
                                   │
                                   ▼
             Generate & Rank Recovery Recommendation Options
                        (recId: REC-100-A, REC-100-B)
                                   │
                                   ▼
            Log Event: zero_result_recommendations_shown
                                   │
                                   ▼
                  User Clicks Recommendation Option B
                                   │
                                   ▼
           Log Event: zero_result_recommendation_clicked
              (recId: REC-100-B, parentSearchId: SRCH-100)
                                   │
                                   ▼
        Execute Recovery Search (new searchId: SRCH-101)
              (parentSearchId: SRCH-100, recId: REC-100-B)
                                   │
                                   ▼
           Log Event: zero_result_search_recovered
               (searchId: SRCH-101, resultCount: 7)
                                   │
                                   ▼
        User Views Property ──► Log PROPERTY_VIEWED
             (searchId: SRCH-101, recoveredFrom: SRCH-100)
```

---

## 3. Zero-Result Failure Classification Taxonomy

| Failure Reason Code | Classification Criteria | System Primary Diagnosis |
|---|---|---|
| `NO_INVENTORY` | 0 properties exist in MongoDB for requested `city` / `governorate` regardless of dates/filters. | Supply gap in specified location. |
| `NO_AVAILABILITY` | Properties exist in destination, but 100% are reserved/unavailable for requested `[checkIn, checkOut]`. | Date calendar collision. |
| `PRICE_TOO_RESTRICTIVE` | Published properties exist in city, but 0 are under requested `maxPrice`. | Budget filter is too low. |
| `GUEST_CAPACITY_TOO_RESTRICTIVE` | Properties exist, but 0 have `capacity.guests >= requestedGuests`. | Guest count exceeds available capacities. |
| `BEDROOM_REQUIREMENT_TOO_RESTRICTIVE` | Properties exist, but 0 have `capacity.bedrooms >= requestedBedrooms`. | Bedroom count requirement too restrictive. |
| `AMENITIES_TOO_RESTRICTIVE` | Properties exist, but 0 match all requested amenity tags (e.g. Pool + Air Con + Beach). | Feature filter combination over-constrained. |
| `LOCATION_TOO_RESTRICTIVE` | 0 properties in specific `area` (neighborhood), but properties exist in broader `city`. | Zone filter too narrow. |
| `MULTIPLE_CONSTRAINTS` | 2 or more filters independently eliminate matching inventory. | Over-constrained search payload. |
| `INVALID_SEARCH` | Malformed or out-of-bounds parameters. | Validation error. |

---

## 4. Recommendation API DTO Payload Contract

When `resultCount === 0`, the search API response includes a `recovery` metadata block:

```ts
export interface ZeroResultRecoveryDTO {
  searchId: string;                 // SRCH-100
  failureReason: ZeroResultFailureReason;
  primaryConstraint: "destination" | "dates" | "price" | "guests" | "bedrooms" | "amenities";
  recommendations: Array<{
    recommendationId: string;       // REC-100-A
    type: "RELAX_LOCATION" | "RELAX_DATES" | "RELAX_PRICE" | "RELAX_GUESTS" | "RELAX_AMENITIES" | "CLEAR_FILTERS";
    label: string;                  // User-facing French copy
    explanation: string;            // Reason why recommendation produces results
    projectedCount: number;         // Projected result count if accepted
    modifiedParams: Record<string, unknown>; // URL searchParams to apply
  }>;
}
```
