# LOC MAISON — Location Domain & Destination Audit

## 1. Executive Summary
LOC MAISON is expanding from Mahdia to nationwide Tunisian coverage. This audit inspects how locations, governorates, cities, and areas are structured, validated, and stored across frontend, backend, and database schemas.

---

## 2. Location References Map

| Domain Layer | Location Source | Storage Format | Status |
|---|---|---|---|
| **Frontend Selects** | `TUNISIAN_DESTINATIONS` constant | Static string array | ⚠️ Frontend Constant |
| **Search Engine** | Query params (`destination`, `city`, `area`) | URL string params | ✅ Dynamic Query |
| **Property Model** | MongoDB `city`, `area`, `address` | Text string fields | ✅ MongoDB Stored |
| **Request Model** | MongoDB `destination`, `area` | Text string fields | ✅ MongoDB Stored |
| **Location API** | `/api/destinations` | Dynamic DB JSON | ✅ API Available |

---

## 3. Location Domain Architecture Target

```text
Admin Location Management
   ↓
Location Repository & Service (`src/server/locations/`)
   ↓
MongoDB `locations` Collection (Governorate → City → Area)
   ↓
`/api/destinations` Endpoint
   ↓
Customer Search / Owner Listing Forms
```

### Backwards Compatibility Rule
Existing database records containing `city: "Mahdia"`, `area: "Hiboun"` must continue to resolve cleanly during transition.
