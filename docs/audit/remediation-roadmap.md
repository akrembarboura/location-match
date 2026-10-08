# LOC MAISON — Remediation Roadmap

Based on the repository-wide audit, the following prioritized roadmap organizes future enhancements while preserving zero breaking changes for active database records:

---

## P0 — Must Fix Before Pilot
- **Location Domain Integration**: Build MongoDB-backed Location collection (`src/server/locations/`) to serve dynamic governorates/cities/areas via `/api/destinations`, eliminating reliance on hardcoded frontend arrays while preserving string resolution for existing records.
- **Card Primitive Unification**: Consolidate `HouseCard.tsx` and `PropertyCard.tsx` into a single canonical `<PropertyCard />` primitive in `src/components/shared/PropertyCard.tsx`.

---

## P1 — Important for Pilot Quality
- **Form Schema Synergy**: Align `Field.tsx` un-controlled wizard fields with `ui/form.tsx` React Hook Form schemas across public requests.
- **Enhanced Zero-Result Search Banners**: Expand deterministic recommendation chips on empty search result pages.

---

## P2 — UX / Product Improvements
- **Optimistic UI Updates**: Apply optimistic mutations for property favoriting and availability calendar toggles.
- **Enhanced Micro-Interactions**: Smooth spring transition animations for drawer dialogs on mobile.

---

## P3 — Future Architecture
- **GraphQL / Unified API Gateway**: Explore consolidated API schemas for future mobile native applications (iOS / Android).
