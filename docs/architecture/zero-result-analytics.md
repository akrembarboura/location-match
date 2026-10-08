# LOC MAISON — TASK 17 Zero-Result Analytics & Recovery Metrics Specification

**File Path:** `docs/architecture/zero-result-analytics.md`  
**Date:** October 8, 2026  
**Auditor & Protocol Designer:** Antigravity AI  

---

## 1. Zero-Result Recovery Analytics Events

To measure search failure recovery efficacy, TASK 17 defines 3 explicit analytics events extending the taxonomy established in TASK 16:

### 1.1 `zero_result_recommendations_shown` Event Payload

```ts
export interface ZeroResultRecommendationsShownPayload {
  eventName: "zero_result_recommendations_shown";
  searchId: string;               // SRCH-100 (Original failing searchId)
  sessionId: string;
  anonymousId: string;
  userId?: string;
  failureReason: ZeroResultFailureReason;
  primaryConstraint: string;
  recommendationsShown: Array<{
    recommendationId: string;     // REC-100-A
    type: string;
    projectedCount: number;
  }>;
  occurredAt: Date;
}
```

---

### 1.2 `zero_result_recommendation_clicked` Event Payload

```ts
export interface ZeroResultRecommendationClickedPayload {
  eventName: "zero_result_recommendation_clicked";
  searchId: string;               // SRCH-100 (Original failing searchId)
  recommendationId: string;       // REC-100-B
  recommendationType: string;     // RELAX_DATES | RELAX_PRICE | RELAX_LOCATION
  sessionId: string;
  anonymousId: string;
  userId?: string;
  occurredAt: Date;
}
```

---

### 1.3 `zero_result_search_recovered` Event Payload

```ts
export interface ZeroResultSearchRecoveredPayload {
  eventName: "zero_result_search_recovered";
  parentSearchId: string;         // SRCH-100 (Failed searchId)
  recoverySearchId: string;       // SRCH-101 (New execution searchId)
  recommendationId: string;       // REC-100-B
  recommendationType: string;
  resultCount: number;            // Must be > 0
  sessionId: string;
  anonymousId: string;
  userId?: string;
  occurredAt: Date;
}
```

---

## 2. Recovery Efficacy Metrics & Mathematical Definitions

### 2.1 Zero-Result Rate (%)
```text
Zero-Result Rate (%) = 
  (Total SEARCH_RESULTS_RETURNED where resultCount === 0) / (Total SEARCH_SUBMITTED) * 100
```

### 2.2 Recommendation Acceptance Rate (%)
```text
Recommendation Acceptance Rate (%) = 
  (Total zero_result_recommendation_clicked) / (Total zero_result_recommendations_shown) * 100
```

### 2.3 Search Recovery Success Rate (%)
```text
Search Recovery Success Rate (%) = 
  (Total zero_result_search_recovered where resultCount > 0) / (Total zero_result_recommendation_clicked) * 100
```

### 2.4 Recovered Search Conversion Rate (%)
```text
Recovered Search ➔ Property View Conversion Rate (%) = 
  (Count of PROPERTY_VIEWED with recoveredFrom === parentSearchId) / (Total zero_result_search_recovered) * 100
```

---

## 3. Full Recovery Attribution Funnel

```text
              Original Search (0 Results) [searchId: SRCH-100]
                                   │
                                   ▼
             Recommendations Shown [zero_result_recommendations_shown]
                                   │
                                   ▼
            Recommendation Clicked [zero_result_recommendation_clicked]
              (recId: REC-100-B, type: RELAX_DATES)
                                   │
                                   ▼
              Recovered Search (7 Results) [searchId: SRCH-101]
                                   │
                                   ▼
                Property Card Clicked [PROPERTY_CARD_CLICKED]
                                   │
                                   ▼
               Property Page Viewed [PROPERTY_VIEWED]
                                   │
                                   ▼
               Housing Request Submitted [REQUEST_SUBMITTED]
                                   │
                                   ▼
               Reservation Confirmed [RESERVATION_CONFIRMED]
```
