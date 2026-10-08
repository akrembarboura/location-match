# LOC MAISON — Spacing System & Grid Rhythm

**File Path:** `docs/design-system/spacing.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Tailwind Spacing Scale (4px Base Grid)

LOC MAISON enforces a consistent 4px rhythm using standard Tailwind CSS classes. Arbitrary pixel offsets (e.g. `mt-[13px]`) are forbidden unless calculating dynamic UI overlays.

| Token / Class | Pixel Equivalent | Usage Guidelines |
|---|---|---|
| `gap-1` / `p-1` | 4px | Micro-padding, inline tag icons |
| `gap-2` / `p-2` | 8px | Button icon spacing, badge padding, compact chip lists |
| `gap-3` / `p-3` | 12px | Form input internal padding, search pill bar gap |
| `gap-4` / `p-4` | 16px | Card internal padding, form field gap, table cell padding |
| `gap-6` / `p-6` | 24px | Dashboard grid gap, section card spacing, modal padding |
| `gap-8` / `p-8` | 32px | Major section boundaries, hero grid gaps |
| `py-10` / `py-12` | 40px - 48px | Page container vertical padding |

---

## 2. Container Boundaries & Grid Columns

- **Max Content Width:** `max-w-6xl` (1152px) for public search and property detail views; `max-w-7xl` (1280px) for Admin/Owner dashboard views.
- **Horizontal Padding:** `px-4 sm:px-6 lg:px-8` on all page shells.
- **Card Grids:**
  - Public Search Results: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`
  - Dashboard KPIs: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`

