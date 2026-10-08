# LOC MAISON — Component Architecture & Layering

**File Path:** `docs/design-system/components.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Three-Layer Component Hierarchy

```text
Layer 1: Generic UI Primitives (src/components/ui/)
         └── Button, Badge, Card, Input, Select, Dialog, Sheet, Sidebar, Table, Chart, Calendar...
                                │
                                ▼
Layer 2: Shared Domain Primitives (src/components/shared/)
         └── PropertyStatusBadge, ReservationStatusBadge, PriceFormatter, AsyncStateContainer...
                                │
                                ▼
Layer 3: Feature Domain Components (src/components/public/, customer/, owner/, admin/)
         └── SearchBar, PropertyCard, OwnerKpiCard, PropertyModerationQueue, OwnerPropertyForm...
```

---

## 2. Button Hierarchy & Allowed Usage

| Button Variant | Visual Semantics | Usage Guidelines |
|---|---|---|
| **Primary (`default`)** | Solid Teal (`bg-primary text-primary-foreground`) | Main CTA per screen ("Demander une réservation", "Publier mon bien"). Max 1 primary CTA per viewport. |
| **Secondary** | Warm Sand (`bg-secondary text-secondary-foreground`) | Secondary actions ("Modifier la recherche", "Fermer"). |
| **Outline** | Bordered (`border border-border bg-card`) | Neutral filter buttons, pagination controls. |
| **Ghost** | Transparent (`hover:bg-muted`) | Table row action menus, icon buttons. |
| **Destructive** | Solid Red (`bg-destructive text-destructive-foreground`) | Destructive actions ("Supprimer le bien", "Refuser l'annonce"). |
| **Link** | Text link (`text-primary hover:underline`) | Inline navigation text. |

---

## 3. Audit of Existing Component Duplications & Refactoring Plan

- ⚠️ **`Field.tsx` (`SelectField`, `InputField`):** Duplicate custom input controls. Must be refactored to wrap `src/components/ui/input.tsx` and `src/components/ui/select.tsx`.
- ⚠️ **`HouseCard.tsx` vs `PropertyCard.tsx`:** Duplicate card components. `PropertyCard.tsx` in `src/components/site/` (or `shared/`) is designated as the single canonical card primitive.

