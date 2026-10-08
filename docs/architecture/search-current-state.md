# LOC MAISON — TASK 15 Search System Current State Audit

**File Path:** `docs/architecture/search-current-state.md`  
**Date:** October 8, 2026  
**Auditor:** Antigravity AI  

---

## 1. Executive Summary & Audit Baseline

This document presents an empirical trace of the LOC MAISON search pipeline across both search entry points (`/properties` and `/houses`). It details the end-to-end flow from user interface controls down to MongoDB Mongoose queries and DTO responses.

---

## 2. Complete Search Parameter Trace Matrix

| Filter | UI Source Control | API Parameter | Zod Validation | MongoDB Query Operator | Status | Findings / Issues |
|---|---|---|---|---|---|---|
| **Destination** | SearchBar input (`/houses`) | `city` | `z.string().min(1).max(100)` | `new RegExp('^' + escapeRegex(city) + '$', 'i')` on `city` & `location.city` | ⚠️ Needs Improvement | Strict exact-match regex fails on neighborhood/area names (e.g. "Hiboun", "Zone Touristique"). |
| **Dates (Check-in / Check-out)** | SearchBar DatePicker (`/houses`) | `checkIn`, `checkOut` | `YYYY-MM-DD` regex + `checkOut > checkIn` refine | `$not: { $elemMatch: { from: < checkOut, to: > checkIn } }` & `$nor: [ { reservation } ]` | ✅ Correct | Date collision logic correctly checks both `unavailable` array and active `reservation` object. |
| **Guests** | SearchBar Select (`/houses`) | `guests` | `z.coerce.number().int().min(1).max(30)` | `$or: [ { guests: { $gte: N } }, { "capacity.guests": { $gte: N } } ]` | ✅ Correct | Correctly queries both flat `guests` and structured `capacity.guests`. |
| **Category** | Category pills bar (`/houses`) | `category` | `z.string().max(80)` | Specialized category mapping (`"villa"`, `"house"`, `"apartment"`, `"beach"`, `"family"`, `"pool"`) | ⚠️ Needs Improvement | Hardcoded category string checks in repository instead of dynamic DB taxonomy lookups. |
| **Rental Category** | Category toggle / Pill (`/properties` & `/houses`) | `rentalCategory` | `z.string().max(40)` | `$or: [ { rentalCategory }, { rentalCategories: rentalCategory } ]` | ✅ Correct | Correctly filters Summer vs Student housing listings. |
| **Price Range** | ❌ Missing | ❌ None | ❌ None | ❌ None | 🔴 Critical | Neither `minPrice` nor `maxPrice` is supported in API or repository queries. |
| **Bedrooms** | ❌ Missing | ❌ None | ❌ None | ❌ None | ⚠️ Needs Improvement | Missing from search input schema despite existing in `capacity.bedrooms`. |
| **Amenities** | ❌ Missing | ❌ None | ❌ None | ❌ None | ⚠️ Needs Improvement | Missing multi-select amenity filtering (e.g. Wi-Fi, Air Conditioning, Pool). |
| **Pagination** | Pagination nav buttons (`/houses`) | `page`, `limit` | `page: z.coerce.number().min(1)`, `limit: z.coerce.number().min(1).max(50)` | `.skip((page - 1) * limit).limit(limit + 1)` | ✅ Correct | Handled in `PropertyRepository.search()` and returned via HTTP headers (`X-Page`, `X-Page-Size`, `X-Has-More`). |
| **Sorting** | ❌ Missing | ❌ None | ❌ None | `.sort({ createdAt: -1 })` | ⚠️ Needs Improvement | Only default descending creation date is implemented. Price and popularity sorts are missing. |

---

## 3. Database Availability Definition

In the LOC MAISON MongoDB database (`PropertyModel`), a property is defined as **AVAILABLE** for a requested date range `[checkIn, checkOut]` if and only if:

```text
               Property.status === "PUBLISHED" (or isPublished: true)
                                      │
                                      ▼
    Property.unavailable array contains NO overlapping range:
    NOT (unavailable.from < checkOut AND unavailable.to > checkIn)
                                      │
                                      ▼
    Property.reservation object contains NO overlapping booking:
    NOT (availabilityStatus === "RESERVED" AND reservation.from < checkOut AND reservation.to > checkIn)
```

---

## 4. UI Inconsistencies & Legacy Code Issues

1. **`app/properties/page.tsx` Client-Side Filtering Bug:**
   - On `/properties`, the page fetches `/api/properties?rentalCategory=...` and performs **client-side filtering** for `area` and `propertyType` using JavaScript `.filter()`.
   - **Fix Required:** Pass `area` and `type` directly to the server API so pagination and counts remain accurate.

2. **Duplicate Model Legacy Fallbacks:**
   - `PropertyService.ts` contains fallback lookups to `HouseModel` for legacy seed data. All production inventory must rely exclusively on `PropertyModel`.

3. **Empty Results Handling:**
   - Returning `[]` when no properties match results in a generic empty container without contextual suggestions (e.g. shifting dates or removing filters).
