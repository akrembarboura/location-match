# LOC MAISON — Admin Data Lineage & Query Architecture

**Audit Date:** October 9, 2026  
**Auditor:** Senior Product Architect & Engineering Team  
**Scope:** Complete data lineage map tracing UI components to backend endpoints, services, repository queries, and MongoDB collections.

---

## 1. Overview of Data-Fetching Principles

1. **No In-Memory Slicing:** Collections are never loaded in full into Node.js memory. All filtering, sorting, pagination, and aggregation happen inside MongoDB.
2. **Lean Projections:** Read queries enforce `.select(...)` projections and `.lean()` execution to minimize memory overhead and payload size.
3. **Database-First Aggregation:** Financial sums, status counts, and conversion percentages are calculated using MongoDB pipelines (`$match`, `$group`, `$count`, `countDocuments`).

---

## 2. Metric & Data Lineage Register

| Page & Component | Display Label | Data Meaning | Actual Backend Source | Transformation / Calculation | Time Period / Filter | Reliability | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin` (Pastel Card 1) | Biens enregistrés | Total properties registered in catalog | `PropertyModel.countDocuments({})` + `HouseModel.countDocuments({})` | Sum of counts via `Promise.all` | All-time | Verified | Keep |
| `/admin` (Pastel Card 2) | Demandes ouvertes | Total active housing requests awaiting match | `HousingRequestModel.countDocuments({ status: "PENDING" })` | Count operation | All-time / Status `PENDING` | Verified | Keep |
| `/admin` (Pastel Card 3) | Paiements à vérifier | Cash payments reported by owners awaiting admin audit | `ReservationModel.countDocuments({ paymentStatus: "REPORTED" })` | Count operation | Status `REPORTED` | Verified | Keep |
| `/admin` (Pastel Card 4) | Contrats conclus | Confirmed reservation deals closed on platform | `ReservationModel.countDocuments({ status: "CONFIRMED" })` | Count operation | Status `CONFIRMED` | Verified | Keep |
| `/admin` (Marketplace) | Conversion Vue → Demande | Percentage of property views converting to inquiries | `analyticsRepository.getPropertyViews()` vs `HousingRequestModel.countDocuments()` | `(requests / views) * 100` via `safeDivide` | Selected period (30d default) | Verified | Keep |
| `/admin` (Property Card) | Demandes (per property) | Housing requests referencing specific property | `HousingRequestModel.countDocuments({ $or: [{ propertyId }, { selectedProperty: propertyId }] })` | Direct count | Per property | Verified | Keep |
| `/admin` (Property Card) | Réservations (per property) | Confirmed reservations for specific property | `ReservationModel.countDocuments({ propertyId, status: "CONFIRMED" })` | Direct count | Per property | Verified | Keep |
| `/admin/analytics` | Visitors / Sessions | Unique visitors tracking | `AnalyticsRepository.countUniqueVisitors(period)` | MongoDB distinct `visitorId` / `sessionId` count on `AnalyticsEventModel` | Selected period (7d/30d/90d/all) | Verified | Keep |
| `/admin/analytics` | Property Views | Total property detail views | `analyticsRepository.countEvents("property_viewed", period)` | `$match` eventName `property_viewed` | Selected period | Verified | Keep |
| `/admin/requests` | List of Requests | Paginated list of client rental requests | `HousingRequestModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()` | Direct query with populated user/property details | Page N, Status tab, Search text | Verified | Keep |
| `/admin/properties` | Property Catalog | Paginated moderation inventory | `PropertyModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()` | Direct query with populated owner info | Page N, Status tab | Verified | Keep |
| `/admin/properties/[id]` | Availability Status | Real-time availability indicator | `property.availabilityStatus` (`AVAILABLE` / `RESERVED`) | Field stored on `PropertyModel` | Current state | Verified | Keep |

---

## 3. Data Flow Architecture Diagram

```
[ UI Component (React Client) ]
           │
           │ HTTP GET / POST (JSON)
           ▼
[ Next.js API Route (app/api/admin/...) ]
           │
           │ Auth Guard (requireRole) & Rate Limit Check (POLICIES.ADMIN_API)
           ▼
[ Admin Service Layer (PropertyService / AnalyticsService) ]
           │
           │ Query / Aggregation Pipeline
           ▼
[ Repository Layer (PropertyRepository / AnalyticsRepository) ]
           │
           │ Mongoose Mapped Query (.select().lean())
           ▼
[ MongoDB Database (Property, Request, Reservation, AnalyticsEvent) ]
```

---

## 4. Query Performance Audit

1. **Pagination Standard:** All admin tables (`/admin/properties`, `/admin/requests`, `/admin/activities`, overview property grid) implement explicit `page` and `limit` params with `.skip((page - 1) * limit).limit(limit)`.
2. **Parallel Query Optimization:** Independent counts on `/admin` overview execute concurrently using `Promise.all([...])`, avoiding sequential query blocking.
3. **No Unbounded Aggregations:** Aggregations filter by `createdAt` date ranges where applicable, ensuring performance remains logarithmic even as database grows to tens of thousands of records.

