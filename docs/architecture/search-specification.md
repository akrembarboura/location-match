# LOC MAISON — TASK 15 Target Search Specification

**File Path:** `docs/architecture/search-specification.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Specification Objective

This specification details the target search contract for LOC MAISON without modifying existing user-facing UI prematurely. It outlines the schema extensions, server-side filtering enhancements, and empty result recovery strategies for upcoming execution.

---

## 2. Extended Search Input Schema Contract

```ts
export const ExtendedPropertySearchSchema = PropertySearchSchema.extend({
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).max(10).optional(),
  amenities: z.array(z.string()).max(20).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "featured"]).optional().default("newest"),
});
```

---

## 3. Empty Search Results Recovery Protocol (Task 17 Specification)

When `properties.length === 0`, the API response payload will provide contextual recommendation triggers:

```json
{
  "properties": [],
  "recommendations": {
    "reason": "ZERO_RESULTS_MATCHED",
    "suggestedActions": [
      {
        "type": "EXPAND_LOCATION",
        "label": "Voir tous les logements à Mahdia",
        "params": { "city": "Mahdia" }
      },
      {
        "type": "ADJUST_DATES",
        "label": "Essayer des dates flexibles (± 3 jours)",
        "params": { "flexible": true }
      },
      {
        "type": "CLEAR_FILTERS",
        "label": "Réinitialiser les filtres",
        "params": {}
      }
    ]
  }
}
```

---

## 4. Search Audit Summary Report

```text
SEARCH AUDIT SUMMARY

✅ Correct
  - Date range overlap logic against MongoDB reservations and unavailable arrays
  - Guest capacity minimum checking (guests >= N)
  - Public visibility security guard (status === "PUBLISHED" strictly enforced)
  - Page & limit skip pagination

⚠️ Needs Improvement
  - Exact regex match for city fails on neighborhood/area queries
  - Hardcoded category string checks in PropertyRepository
  - Sorting limited to creation date descending
  - Client-side filtering bug in /properties page

🔴 Critical Gaps
  - Missing minPrice / maxPrice range filters
  - Missing amenity multi-select filters
  - Static "Aucun résultat" empty state without recovery recommendations
```

