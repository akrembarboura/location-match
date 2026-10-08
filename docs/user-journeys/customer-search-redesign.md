# LOC MAISON — TASK 21 Customer Search Experience Specification

**File Path:** `docs/user-journeys/customer-search-redesign.md`  
**Date:** October 8, 2026  
**Auditor & UX Architect:** Antigravity AI  

---

## 1. Executive Summary & Refactoring Findings

TASK 21 refactored the customer property search experience on `/properties` to connect directly with the server-side search pipeline established in TASK 15, search analytics in TASK 16, empty result recovery rules in TASK 17, and design system primitives in TASKS 18–20.

---

## 2. Refactoring Changes Implemented

| Area | Previous State | New Refactored State | Benefit / Impact |
|---|---|---|---|
| **Query Filtering** | Client-side JavaScript `.filter()` for `area` and `type` | Server-side API parameter passing (`/api/properties?city=...&category=...&rentalCategory=...`) | Eliminates browser-side filtering discrepancies; page counts and pagination remain 100% accurate. |
| **UX State Primitive** | Manual ternary operators for loading, error, empty | Unified `<AsyncStateContainer />` from `src/components/shared/` | Guarantees consistent loading skeletons, error alerts, and domain empty states across all viewports. |
| **Empty Result Recovery** | Static "Aucun logement disponible" paragraph | Actionable empty recovery CTA ("Réinitialiser les filtres") matching Task 17 specification | Prevents zero-result search dead ends and tracks user recovery actions. |
| **Mobile Padding** | `py-10` container padding | `pb-24 lg:pb-12` bottom container padding | Ensures content and filter controls are never obscured by fixed `<MobileTabBar />` on mobile screens. |
| **Component Primitives** | Reused `<PropertyCard />` from `src/components/site/` | Preserved `<PropertyCard />` canonical card primitive | Follows strict component layering rule (primitives ➔ shared ➔ domain). |

---

## 3. Verified End-to-End Flow

```text
  [ User selects area="Mahdia", type="Apartment", use="Étudiant" ]
                                  │
                                  ▼
   [ GET /api/properties?city=Mahdia&category=Apartment&rentalCategory=student ]
                                  │
                                  ▼
      [ AsyncStateContainer renders Loading Skeleton or Data Grid ]
                                  │
                                  ▼
      [ PropertyCard Grid rendered with Real Database Properties ]
```
