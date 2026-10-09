# LOC MAISON — Admin UI Component Inventory

**Audit Date:** October 9, 2026  
**Auditor:** Senior Product Architect & Engineering Team  
**Scope:** Exhaustive catalog of user interface components, layout elements, modals, tables, KPI cards, and controls across the admin console.

---

## 1. Global Shell & Navigation System (`AdminShell.tsx`)

| UI Element | Component File Path | Visual Description / Pattern | Props & State | Verified Functionality |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop Sidebar** | `src/components/admin/AdminShell.tsx` | Fixed dark teal panel (`w-60` expanded, `w-16` collapsed) with `sticky top-0 h-screen overflow-y-auto`. | `isCollapsed` (boolean, saved in `localStorage`) | Pinned to left, does not scroll away with body content. |
| **Sidebar Toggle Button** | `src/components/admin/AdminShell.tsx` | Icon button (`PanelLeftClose` / `PanelLeftOpen`). | `toggleSidebar()` | Toggles sidebar width smoothly and persists preference in `localStorage`. |
| **Brand Logo** | `src/components/brand/Logo.tsx` | Platform logo icon + title text. | `Logo` component | Links directly to public home `/`. |
| **Navigation Links** | `src/components/admin/AdminShell.tsx` | Vertical list of 6 items (`Vue d'ensemble`, `Demandes`, `Clients`, `Biens`, `Statistiques`, `Activités`). | Active state via `usePathname()` matching | Highlights active route with accent color and subtle shadow. |
| **Site Link** | `src/components/admin/AdminShell.tsx` | Bottom sidebar link (`ArrowLeft` icon + "Retour au site"). | `href="/"` | Navigates back to public marketplace. |
| **Logout Button** | `src/components/admin/AdminShell.tsx` | Pinned red bottom button (`LogOut` icon + "Déconnexion"). | `handleLogout()` triggering `POST /api/auth/logout` | Clears auth session cookies and redirects to `/login`. |
| **Header Bar** | `src/components/admin/AdminShell.tsx` | Clean white top bar with user profile greeting, dropdown menu, notifications, and primary action CTA. | User profile state from `/api/auth/me` | Sticky header with responsive mobile layout. |
| **User Profile Dropdown** | `src/components/admin/AdminShell.tsx` | Dropdown card triggered by profile avatar (`Bonjour, [Name] 👋`). | `profileMenuOpen` state, outside click listener | Shows full user details, role badge (`ADMIN`), rights summary, and direct logout button. |
| **Notification Bell** | `src/components/admin/AdminNotificationBell.tsx` | Bell icon with live unread badge (`bg-rose-500`) and popover drawer. | Unread count state, `fetchNotifications()` | Displays live unread admin notifications with "Mark as read" functionality. |
| **Header Action CTA** | `src/components/admin/AdminShell.tsx` | Primary blue button (`+ Gérer les annonces`). | `href="/admin/properties"` | Direct shortcut to property verification queue. |

---

## 2. Overview Dashboard UI Breakdown (`app/admin/page.tsx`)

| Section | UI Element | Source / Pattern | Displayed Information | Action / Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Operational Urgency** | Urgency Banner | `AlertTriangle` container | "À traiter aujourd'hui" counter summary | Dynamic counter based on sum of pending actions |
| **Urgency Cards** | 3 Action Cards | `bg-surface` rounded cards | 1. Biens en attente<br>2. Demandes ouvertes<br>3. Paiements à vérifier | Links to respective filtered queues (`/admin/properties?status=PENDING_REVIEW`, `/admin/requests`, etc.) |
| **Pastel KPI Cards** | 4 Soft Pastel Cards | `bg-sky-50`, `bg-amber-50`, `bg-emerald-50`, `bg-purple-50` | 1. Biens enregistrés (`totalProperties`)<br>2. Demandes ouvertes (`openRequests`)<br>3. Paiements à vérifier (`pendingPayments`)<br>4. Contrats conclus (`contractsCount`) | Top-right icons (`Building2`, `Inbox`, `CreditCard`, `FileCheck`), trend indicators, live DB counts |
| **Marketplace Funnel** | Marketplace Bar & Stats | Distribution card | Searches → Views → Requests → Proposals → Reservations | Calculates real conversion percentages between stages |
| **Status Distributions** | 2 Bar Charts | Distribution bars | 1. Demandes par statut (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`)<br>2. Réservations & Règlements (`UNPAID`, `REPORTED`, `VERIFIED`, `REFUNDED`) | Color-coded segment bars with counts and percentages |
| **Top Destinations** | Destination Demand List | Numbered list cards | Top 5 searched/requested cities in Tunisia with demand badge | Aggregated demand counts per city |
| **Property Inventory** | Visual Property Grid | 3-column card grid | Property cover photo, moderation badge, price tag, title, city, rental category, 3 metric pills (Demandes, Réservations, Date) | Dual action buttons: `Données & Clients` (`/admin/properties/[id]#owner`) vs `Voir Performance` (`/admin/properties/[id]#analytics`) |
| **Pagination** | Inventory Controls | `ChevronLeft` / `ChevronRight` | Current page number / total pages | Fetches page N server-side without full refresh |
| **Recent Data Tables** | 3 Summary Tables | Rounded card tables | 1. 5 Recent Requests<br>2. 5 Recent Properties<br>3. 3 Recent Deals | Direct link to view full record details |

---

## 3. Property Moderation & Review UI (`app/admin/properties/[id]/page.tsx`)

| Section | UI Element | Visual Pattern | Functional Details | Anchor ID |
| :--- | :--- | :--- | :--- | :--- |
| **Top Bar** | Back Link & Status Badge | `ArrowLeft` + `PropertyModerationBadge` | Direct return to catalog + current moderation status tag | N/A |
| **Action Toolbar** | Workflow Action Buttons | Contextual buttons | `Prendre en charge l'examen` (`UNDER_REVIEW`), `Valider et publier` (`PUBLISHED`), `Refuser` (opens modal), `Archiver` | Top header |
| **Property Gallery** | Photo Carousel & Specs | Image grid + bedroom/bathroom/surface pills | Main photo selector, thumbnail strip, key capacity specs | N/A |
| **Owner Dossier** | Owner Details Card | `ShieldCheck` container | Owner full name, phone number (`Phone`), email (`Mail`), owner ID, user status | `#owner` |
| **Reservation Status** | Availability Card | `Calendar` container | Availability status (`Disponible` / `Réservée`), reservation date range (`Du ... au ...`), `Marquer comme réservé` button, `Libérer le bien` button | `#reservation` |
| **Analytics Card** | Performance Metrics | `BarChart3` container | Views count, Favorites count, Requests count, Proposals count, Vue→Demande %, Demande→Proposition %, Vue→Réservation % | `#analytics` |
| **Timeline** | Moderation History | Vertical event stream | Timestamped record of submissions, reviews, approvals, rejections, and reservations | N/A |
| **Modals** | Reject & Reserve Modals | Backdrop blur modal cards | Reject modal requires text reason (min 5 chars). Reservation modal requires Check-in & Check-out date selection | Modal overlays |

---

## 4. Reusable Shared UI Components Directory

| Component Name | File Path | Scope of Use | Status |
| :--- | :--- | :--- | :--- |
| `AdminShell` | `src/components/admin/AdminShell.tsx` | Base shell for all admin views | Verified & Sticky |
| `AdminStatusBadge` | `src/components/admin/AdminStatusBadge.tsx` | Status tags for properties, requests, payments | Verified |
| `AdminNotificationBell` | `src/components/admin/AdminNotificationBell.tsx` | Live notification bell in header bar | Verified |
| `AsyncStateContainer` | `src/components/shared/AsyncStateContainer.tsx` | Unified container for loading, error, empty, success | Verified |
| `LoadingThreeDotsJumping` | `src/components/shared/LoadingThreeDotsJumping.tsx` | 3-dot jumping loader with brand colors | Verified |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | Empty data fallback UI | Verified |
| `ErrorState` | `src/components/shared/ErrorState.tsx` | Error fallback with retry button | Verified |

