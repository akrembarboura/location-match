# LOC MAISON — TASK 16 Search Metrics & Marketplace Intelligence Specification

**File Path:** `docs/architecture/search-metrics.md`  
**Date:** October 8, 2026  
**Auditor:** Antigravity AI  

---

## 1. Primary Search Metrics & KPI Formulations

### 1.1 Search Demand Intelligence
- **Top Searched Destinations:** Count of `search_submitted` grouped by `city` / `destination`.
- **Top Requested Date Ranges:** Aggregation of `checkIn` & `checkOut` month/week buckets.
- **Rental Category Ratio:** Percentage split between Summer (`"summer"`) vs Student (`"student"`) searches.
- **Average Requested Capacity:** Average `guests` parameter across submitted searches.
- **Price Range Preference:** Histogram of `minPrice` and `maxPrice` search inputs.

---

### 1.2 Supply Gap & Inventory Deficiency Metrics

```text
Destination Supply/Demand Gap Index = 
  (Total Searches for City in 30 Days) / (Total Active Published Properties in City + 1)
```

#### Gap Severity Classification:
- **Critical Supply Deficit (Gap > 10.0):** High search volume with minimal available listings (e.g. 300 searches, 2 properties). Triggers Owner Acquisition Campaign recommendations for Admin.
- **Balanced Supply (1.0 <= Gap <= 5.0):** Healthy marketplace inventory.
- **Excess Supply (Gap < 0.5):** Over-supplied destination with low search interest.

---

### 1.3 Zero-Result Search Failure Metrics

```text
Zero-Result Rate (%) = 
  (Count of SEARCH_RESULTS_RETURNED where resultCount === 0) / (Total SEARCH_SUBMITTED) * 100
```

#### Failure Attribution Categories:
1. **Location Deficit:** Destination has 0 published properties.
2. **Date Collision:** Destination has properties, but all are `RESERVED` or marked `unavailable` for requested dates.
3. **Capacity Mismatch:** Requested `guests` count exceeds available property capacities.
4. **Over-filtering:** Combination of restrictive category, type, and amenity filters.

---

### 1.4 Conversion Funnel Metrics (Search ➔ Payment)

| Funnel Stage | Transition Metric | Calculation Formula |
|---|---|---|
| **Stage 1: Search ➔ View** | Search-to-View Rate | `Count(PROPERTY_VIEWED) / Count(SEARCH_SUBMITTED)` |
| **Stage 2: View ➔ Contact** | View-to-Contact Rate | `Count(CONTACT_OWNER_CLICKED) / Count(PROPERTY_VIEWED)` |
| **Stage 3: Contact ➔ Request** | Contact-to-Request Rate | `Count(REQUEST_SUBMITTED) / Count(CONTACT_OWNER_CLICKED)` |
| **Stage 4: Request ➔ Reservation** | Request-to-Booking Rate | `Count(RESERVATION_CONFIRMED) / Count(REQUEST_SUBMITTED)` |
| **Stage 5: Reservation ➔ Payment** | Booking-to-Payment Rate | `Count(PAYMENT_SUCCEEDED) / Count(RESERVATION_CONFIRMED)` |

---

## 2. Measurement Contract & Database Aggregation Queries

```ts
// Example Mongo Aggregation for Supply/Demand Gap Metrics
db.analyticsevents.aggregate([
  { $match: { eventName: "search_submitted", occurredAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
  { $group: { _id: "$city", searches: { $sum: 1 } } },
  { $lookup: {
      from: "properties",
      localField: "_id",
      foreignField: "city",
      pipeline: [{ $match: { status: "PUBLISHED" } }],
      as: "publishedProperties"
  }},
  { $project: {
      city: "$_id",
      searches: 1,
      availableProperties: { $size: "$publishedProperties" }
  }}
]);
```
