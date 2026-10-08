# LOC MAISON — UI/UX Source of Truth & Design System Rules

**File Path:** `docs/design-system/ui-ux-source-of-truth.md`  
**Date:** October 8, 2026  
**Status:** Approved & Binding Source of Truth  

---

## 1. Primary UI Foundation & Component Sources
- **Component Stack:** `shadcn/ui` primitives (Radix UI + Tailwind CSS v4 + Lucide Icons).
- **Official References:**
  - Components: [https://ui.shadcn.com/](https://ui.shadcn.com/)
  - Dashboard Blocks: [https://ui.shadcn.com/blocks?category=dashboard](https://ui.shadcn.com/blocks?category=dashboard)
  - Sidebar: [https://ui.shadcn.com/docs/components/base/sidebar](https://ui.shadcn.com/docs/components/base/sidebar)
  - Charts: [https://ui.shadcn.com/docs/components/base/chart](https://ui.shadcn.com/docs/components/base/chart) (Recharts)
  - Data Tables: [https://ui.shadcn.com/docs/components/aria/data-table](https://ui.shadcn.com/docs/components/aria/data-table) (TanStack Table)
- **Core Principle:** `shadcn/ui` provides the UI primitives; it is NOT the backend architecture. All demo data must be replaced by real LOC MAISON API endpoints and Mongoose database data.

---

## 2. Component Organization & Architecture Rules

```
src/components/
├── ui/                   # Pure generic shadcn primitives (Button, Input, Dialog, Badge)
├── shared/               # Shared LOC MAISON domain primitives (PropertyStatusBadge, PricingFormatter)
├── public/               # Customer search, detail page, public headers/footers
├── customer/             # Customer dashboard & request management
├── owner/                # Owner property wizard, owner KPI cards, owner calendar
└── admin/                 # Admin moderation queue, client tables, location management
```

### Allowed vs Forbidden Component Naming
- ✅ **ALLOWED (Domain Components):** `PropertyStatusBadge`, `ReservationStatusBadge`, `OwnerPropertyCard`, `RequestStatusBadge`, `PropertyImageManager`, `OwnerKpiCard`, `SearchFilters`.
- ❌ **FORBIDDEN (Generic Duplicates):** `MyButton`, `CustomButton`, `GenericModal2`, `CustomDropdown2`, `AnotherSidebar`.

---

## 3. Strict Data & State Management Rules

### The Golden No-Fake-Data Rule
- 🛑 **Forbidden Pattern:** `const data = apiData || fakeData;`
- 🛑 **Forbidden Pattern:** `setTimeout(() => setMockData(...), 1000);`
- 🛑 **Forbidden Pattern:** Hardcoding fake KPI metrics or revenue charts inside production UI components.
- ✅ **Required Pattern:** Render empty states or loading skeletons when backend data is missing or loading.

### Mandatory 9-State UX System
Every async view or data component MUST support:
1. **Loading:** Skeleton loader or spinner.
2. **Success:** Clean, structured data presentation.
3. **Empty:** Informative empty state explaining *what is empty*, *why*, and providing an *actionable CTA*.
4. **Error:** Helpful error alert with a retry button.
5. **Unauthorized:** Guidance to log in.
6. **Forbidden:** Role permission alert (e.g. non-admin accessing admin portal).
7. **Submitting:** Disabled buttons with inline spinner during form POST/PUT.
8. **Processing:** Active status transition indicator.
9. **Network Failure:** Offline alert.

---

## 4. Status Badges & Visual Semantics

All domain status badges MUST use centralized semantic color definitions:

| Domain | Status | Label (French) | Variant / Color |
|---|---|---|---|
| **Property** | `DRAFT` | Brouillon | Secondary / Muted Gray |
| **Property** | `PENDING_REVIEW` | En attente de validation | Warning / Amber |
| **Property** | `PUBLISHED` / `ACTIVE` | Publiée / Active | Success / Emerald |
| **Property** | `PAUSED` | Masquée temporairement | Warning / Orange |
| **Property** | `REJECTED` | Refusée | Destructive / Red |
| **Property** | `ARCHIVED` | Archivée | Muted / Dark Gray |
| **Request** | `PENDING` | En attente | Warning / Amber |
| **Request** | `ACCEPTED` / `CONFIRMED` | Confirmée | Success / Emerald |
| **Request** | `REJECTED` / `CANCELLED` | Annulée | Destructive / Red |
| **Payment** | `UNPAID` | Non payé | Destructive / Red |
| **Payment** | `REPORTED` | Signalé (Cash) | Info / Blue |
| **Payment** | `VERIFIED` / `SUCCEEDED` | Vérifié / Payé | Success / Emerald |

---

## 5. Mobile & Responsive Design Standards

- **Touch Targets:** Minimum 44x44px clickable area.
- **Navigation:**
  - **Desktop:** Collapsible `Sidebar` + `Header` + `SidebarInset`.
  - **Mobile:** Fixed top header + bottom navigation bar + `Sheet` / `Drawer` for filter drawers.
- **Breakpoint Range Tested:** 375px, 390px, 414px, 768px, 1024px, 1280px+.
- **Form Controls:** Full-width responsive inputs on mobile screens.

---

## 6. Iconography & Typography

- **Icon Set:** Lucide React ONLY (`lucide-react`).
- **Semantic Mappings:**
  - Property: `Building2` / `House`
  - Requests: `ClipboardList`
  - Reservations: `CalendarCheck`
  - Payments: `CreditCard`
  - Performance: `TrendingUp`
  - Settings: `Settings`
  - Notifications: `Bell`
  - Search: `Search`
  - Add Property: `Plus`
  - Edit: `Pencil`
  - Delete: `Trash2`

---

## 7. Definition of Done Checklist for UI Tasks

Before marking any UI task complete, the following checklist MUST pass:
- [ ] Reuses existing `shadcn/ui` primitives without creating duplicates.
- [ ] Consumes real API data via TanStack Query without mock fallbacks.
- [ ] Explicitly handles Loading, Success, Empty, and Error states.
- [ ] Mobile responsive layout tested.
- [ ] Accessibility (keyboard focus, ARIA labels, contrast) verified.
- [ ] No extra unapproved dependencies installed.
- [ ] `npm run lint` passes without errors.
- [ ] `npm test` passes.
- [ ] `npm run build` succeeds cleanly.
