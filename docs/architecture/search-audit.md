# LOC MAISON — TASK 15 Search System Audit Report

**File Path:** `docs/architecture/search-audit.md`  
**Date:** October 8, 2026  
**Auditor:** Antigravity AI  

---

## 1. Audit Matrix & Current Search Parameters

| Search Parameter | Current Implementation | Status | Audit Findings & Recommendations |
|---|---|---|---|
| **Destination** | `city` exact regex match | ⚠️ Warning | Fails on neighborhood/area searches (e.g., "Hiboun", "Zone Touristique"). Needs fuzzy/substring search across `city`, `governorate`, `area`, and `address`. |
| **Dates** | `checkIn` & `checkOut` ISO dates | ✅ Pass | Date collision logic correctly checks `$not: { $elemMatch: { from: < checkOut, to: > checkIn } }` and `$nor: [ { reservation } ]`. |
| **Guests** | `guests: { $gte: N }` | ✅ Pass | Correctly queries both legacy flat `guests` and structured `capacity.guests`. |
| **Category & Type** | Hardcoded category string checks | ⚠️ Warning | Hardcoded mapping in `PropertyRepository.ts` for `"villa"`, `"apartment"`, `"beach"`. Should support dynamic `categoryIds` and array filtering. |
| **Price Filtering** | ❌ Missing | 🔴 Critical Gap | `PropertySearchSchema` lacks `minPrice` and `maxPrice` input parameters. |
| **Amenities** | ❌ Missing | 🟠 High Gap | Cannot filter by specific amenities (e.g. Wi-Fi, Air Conditioning, Swimming Pool). |
| **Sorting** | Fixed `{ createdAt: -1 }` | 🟠 High Gap | Missing sort options: `price_asc`, `price_desc`, `rating_desc`, `featured`. |
| **Pagination** | `page` (default 1), `limit` (default 50) | ✅ Pass | Supported in query headers (`X-Page`, `X-Page-Size`, `X-Has-More`). |
| **Empty Results UX** | Static empty array `[]` | 🔴 Critical Gap | Client renders generic "Aucun résultat" without fallback suggestions. |

---

## 2. Identified Search UX Friction Points

1. **Missing Price & Amenity Filters:** Users cannot filter properties within their budget bounds (`minPrice`/`maxPrice`) or by essential amenities (A/C, Wi-Fi, Beachfront).
2. **Rigid City Match:** Searching for a specific zone inside Mahdia returns 0 results because the query expects an exact city match string.
3. **Single Sort Direction:** Customers cannot sort listings by lowest price or highest rating.
4. **Empty Search Page Drop-off:** Zero-result searches account for a significant portion of user bounce rate because no recommendations are provided.

---

## 3. Required Enhancements for Tasks 16 & 17
- Add `minPrice`, `maxPrice`, `amenities`, `sort` (`"price_asc" | "price_desc" | "newest" | "featured"`) to `PropertySearchSchema`.
- Update `PropertyRepository.search()` to execute price bounds and sorting.
- Design `SEARCH_SUBMITTED` & `ZERO_RESULTS_VIEWED` analytics event tracking (Task 16).
- Implement intelligent empty result fallback recommendations (Task 17).
