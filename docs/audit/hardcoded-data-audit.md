# LOC MAISON — Hardcoded & Mock Data Audit

## 1. Audit Findings

### [HIGH] Hardcoded Destination Constants in Client Schemas
- **Location**: `src/lib/rentals/request-schema.ts` (`TUNISIAN_DESTINATIONS`, `DESTINATION_AREAS`) & `src/lib/mock-data.ts`
- **Issue**: Frontend request forms and search select boxes rely on static arrays (`Mahdia`, `Monastir`, `Sousse`, `Hammamet`, `Djerba`, `Bizerte`, `Nabeul`).
- **Why it matters**: LOC MAISON is designed to scale Tunisia-wide. Destinations should originate from a database-backed Location Domain (`/api/destinations` or Location Collection).
- **Preservation Requirement**: Historical MongoDB property & request documents store text strings (`city: "Mahdia"`, `area: "Hiboun"`). Any migration must preserve string compatibility for existing documents.

### [LOW] Seed & Test Fixtures
- **Location**: `seed.ts` & `tests/`
- **Classification**: Legitimate development seed data and unit test fixtures. Does not affect production API handlers.

---

## 2. Hardcoded Data Score: 85 / 100
