# LOC MAISON — UI/UX Technology & Research Standard

**File Path:** `docs/design-system/technology-and-research-standard.md`  
**Date:** October 8, 2026  
**Status:** Approved & Binding Tech Standard  

---

## 1. Technical Stack Overview

```
                          LOC MAISON DESIGN SYSTEM
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
               UI PRIMITIVES                 DOMAIN COMPONENTS
                     │                               │
               shadcn / Base UI              Customer / Owner / Admin
                     │
     ┌───────────────┼────────┬──────────┬─────────────┐
     │               │        │          │             │
React Aria         Lucide   Tailwind   Motion        Sonner

DATA LAYER
 │
 ├── TanStack Query (Data Fetching & Cache)
 └── TanStack Table (Advanced Data Grids)

ANALYTICS LAYER
 │
 ├── Recharts (Chart Engine)
 └── Tremor (Analytical Layout & KPI Patterns)

FORM LAYER
 │
 ├── React Hook Form
 └── Zod (Schema Validation)

MEDIA LAYER
 │
 ├── Next Image
 └── Cloudinary (Direct Uploads)

FUTURE MAPS
 │
 └── MapLibre (Property Markers)

BACKEND CORE
 │
 ├── Next.js 15 (App Router)
 ├── Domain Services
 ├── Repositories
 └── MongoDB / Mongoose
```

---

## 2. Component Decision Flow

Before introducing any UI library or component, ask the following 7 questions:

1. **Can the existing stack solve it?** If yes, DO NOT install anything.
2. **Can `shadcn/ui` solve it?** Use `shadcn/ui`.
3. **Is it a complex accessibility/keyboard interaction?** Evaluate React Aria / Base UI.
4. **Is it analytical visualization?** Use Recharts / `shadcn` Chart and study Tremor patterns.
5. **Is it advanced table state?** Use TanStack Table.
6. **Is it interactive mapping?** Evaluate MapLibre.
7. **Does no tool solve it?** Only then evaluate a new dependency with documented technical justification.

---

## 3. Strict Prohibitions
- ❌ No mixing unrelated design systems (e.g. MUI + Mantine + Ant Design + Chakra).
- ❌ No fake mock data or `setTimeout` delays in production UI components.
- ❌ No direct database calls from React client components.
- ❌ No replacing working Radix/shadcn components without explicit request.
