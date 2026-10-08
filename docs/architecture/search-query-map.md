# LOC MAISON — TASK 15 Search Query Map

**File Path:** `docs/architecture/search-query-map.md`  
**Date:** October 8, 2026  
**Auditor:** Antigravity AI  

---

## 1. End-to-End Search Data Flow Diagram

```text
  [ User Search UI ]
  (/houses or /properties)
          │
          ▼
   URLSearchParams  ─── (city, category, guests, checkIn, checkOut, page, limit)
          │
          ▼
   [ GET /api/properties ]
          │
          ▼ (Rate Limit Guard: POLICIES.SEARCH)
   [ PropertySearchSchema.safeParse() ]
          │
          ▼
   [ PropertyService.searchPropertiesPage() ]
          │
          ▼
   [ PropertyRepository.search() ]
          │
          ▼ (MongoDB Mongoose Query Executed)
  ┌───────────────────────────────────────────────────────────┐
  │ PropertyModel.find({                                      │
  │   status: "PUBLISHED",                                   │
  │   rentalCategory: filters.rentalCategory,                 │
  │   city: RegExp("^" + city + "$", "i"),                    │
  │   "capacity.guests": { $gte: filters.guests },            │
  │   unavailable: { $not: { $elemMatch: { ... } } },        │
  │   $nor: [ { reservation overlap } ]                      │
  │ }).sort({ createdAt: -1 }).skip(skip).limit(limit + 1)    │
  └───────────────────────────────────────────────────────────┘
          │
          ▼
   [ mapPropertyToPublicDTO() ] ─── Removes sensitive owner info
          │
          ▼
   NextResponse.json(properties, { headers: { X-Has-More, X-Page } })
          │
          ▼
  [ TanStack Query Cache ] (queryKey: ["houses", filters])
          │
          ▼
  [ HouseGrid Render ]
```

---

## 2. Parameter Mapping Specification

| Query Parameter | DTO Map Field | MongoDB Field | Response DTO Output |
|---|---|---|---|
| `city` | `city` | `city`, `location.city` | `city: string` |
| `rentalCategory` | `rentalCategory` | `rentalCategory`, `rentalCategories` | `rentalCategory: "summer" \| "student"` |
| `category` | `category` | `categoryIds`, `features`, `propertyType` | `categoryIds: string[]` |
| `guests` | `capacity.guests` | `guests`, `capacity.guests` | `capacity.guests: number` |
| `checkIn` / `checkOut` | `availability` | `unavailable`, `reservation` | `availabilityStatus: "AVAILABLE"` |
| `page` / `limit` | Pagination Header | Database Skip / Limit | `properties: PublicPropertyDTO[]` |

---

## 3. Relevant MongoDB Indexes Verified

Existing indexes defined in `PropertySchema` (`src/lib/models.ts`):
- `{ status: 1, city: 1, rentalCategory: 1 }` (Compound index for public search queries)
- `{ availabilityStatus: 1, "reservation.from": 1, "reservation.to": 1 }` (Index for date collision checks)
- `{ ownerId: 1, createdAt: -1 }` (Index for owner property management)

