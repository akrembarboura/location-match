# LOC MAISON — TASK 17 Deterministic Search Recommendation Rules

**File Path:** `docs/architecture/search-recommendation-rules.md`  
**Date:** October 8, 2026  
**Auditor & Protocol Designer:** Antigravity AI  

---

## 1. Minimal-Change Deterministic Hierarchy Rules

Recommendations MUST be ranked from **smallest behavioral change to largest behavioral change**. Never suggest drastic changes (e.g. changing from Mahdia to Djerba) if shifting dates by 1 day or expanding location from Area to City produces results.

```text
Priority 1: Relax Location (Area ➔ City ➔ Nearby Zone in same Governorate)
Priority 2: Relax Dates (Shift Check-in ±1 to ±3 Days OR Shorten Stay)
Priority 3: Relax Price (+15% to +25% Budget Expansion)
Priority 4: Relax Capacity / Bedrooms (Reduce Guests or Bedrooms by -1)
Priority 5: Clear Amenity / Feature Constraints
Priority 6: Reset All Filters
```

---

## 2. Location Hierarchy & Dynamic Nearby Resolution

LOC MAISON uses dynamic location database models (`Governorate` ➔ `City` ➔ `Area`) to resolve nearby locations without hardcoding city names in code.

```text
       Governorate (e.g., Mahdia)
              │
    ┌─────────┴─────────┐
    │                   │
 City: Mahdia Ville   City: Rejiche
    │                   │
  Area: Corniche      Area: Plage
```

### Recommendation Logic by Location Level:
1. **Area Level Failure:** If `area: "Corniche"` returns 0 results, propose searching all of `city: "Mahdia Ville"`.
2. **City Level Failure:** If `city: "Rejiche"` returns 0 results, propose nearby cities in the same `governorate: "Mahdia"` (e.g. "Mahdia Ville" or "Salakta").
3. **Governorate Level Failure (`NO_INVENTORY`):** Propose nearest coastal governorate (e.g. Monastir or Sousse).

---

## 3. Specific Constraint Relaxation Rules & User-Facing Copy

### 3.1 Location Relaxation Rules
- **Rule:** Expand `area` to `city`, or suggest adjacent `city` in same `governorate`.
- **User-Facing Copy:** *"Voir 8 logements disponibles à Mahdia Ville (à 3 km de Corniche)"*

### 3.2 Date Relaxation Rules
- **Rule A (Flexible Shift):** Test `checkIn ± 1 day` or `checkIn ± 3 days`.
- **Rule B (Shortened Stay):** If stay is > 7 nights, test 5 nights.
- **User-Facing Copy:** *"12 logements disponibles du 16 au 22 août (décalage de 1 jour)"*

### 3.3 Price Relaxation Rules
- **Rule:** If `maxPrice: 500 TND` yields 0 results, calculate minimum matching price in destination (e.g. 580 TND).
- **User-Facing Copy:** *"Élargir le budget à 580 TND/nuit (+80 TND) pour débloquer 5 logements"*

### 3.4 Capacity Relaxation Rules
- **Rule:** If `guests: 6` yields 0 results, test properties with `capacity.guests >= 5` or `guests >= 4`.
- **User-Facing Copy:** *"Afficher les logements pour 5 personnes (4 logements disponibles)"*

### 3.5 Amenity Relaxation Rules
- **Rule:** Remove restrictive amenity filters (e.g. "Piscine") while keeping destination and dates intact.
- **User-Facing Copy:** *"Retirer le filtre 'Piscine' (débloque 14 logements avec vue mer)"*

---

## 4. Multi-Constraint Ranking Engine

When multiple constraints fail simultaneously, rank candidate recommendations by **Projected Result Yield**:

```ts
function rankRecommendations(candidates: CandidateRecommendation[]): RankedRecommendation[] {
  return candidates
    .filter((c) => c.projectedCount > 0)
    .sort((a, b) => {
      // 1. Sort by Priority Rank (1 = Location, 2 = Dates, 3 = Price, 4 = Capacity)
      if (a.priorityRank !== b.priorityRank) {
        return a.priorityRank - b.priorityRank;
      }
      // 2. Tie-breaker: Highest projected result yield
      return b.projectedCount - a.projectedCount;
    })
    .slice(0, 3); // Present top 3 actionable options
}
```

