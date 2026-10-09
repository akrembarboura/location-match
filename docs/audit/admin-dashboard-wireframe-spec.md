# LOC MAISON — Admin Dashboard Wireframe Specification & UI Layout Architecture

## 1. Overview & Layout Principles

This specification details the proposed responsive wireframe design and layout architecture for the redesigned LOC MAISON Admin Panel. The target layout enforces a strict **5-Level Hierarchy** ensuring predictable navigation, spatial clarity, high density for desktop operational workflows, and collapsible drawer support for touch devices.

### 5-Level Layout Hierarchy

```
+---------------------------------------------------------------------------------------------------+
| LEVEL 1: TOP UTILITY BAR (Global search, System status, Quick actions, Notifications, User Menu) |
+-------------------------------+-------------------------------------------------------------------+
| LEVEL 2: MAIN SIDEBAR         | LEVEL 3: PAGE HEADER & ACTION TOOLBAR                             |
|                               | (Breadcrumbs, Page Title, Date Range Filter, Primary CTA Buttons) |
| - Brand Logo & Switcher       +-------------------------------------------------------------------+
| - Module Nav Items            | LEVEL 4: CORE CANVAS                                              |
| - Quick Counters              |                                                                   |
| - Environment / Role Indicator| [ Section A: Executive KPI Scorecard Grid ]                        |
|                               | [ Section B: Operational Controls & Sub-filters ]                 |
|                               | [ Section C: Primary Data Workspace (Data Table / Grid) ]          |
|                               | [ Section D: Detail Drawer / Contextual Inspection Panel ]        |
|                               +-------------------------------------------------------------------+
| - User Session & Quick Logout | LEVEL 5: STATUS BAR / REFRESH FOOTER                              |
|                               | (Last Synced, Active API Latency, Pagination, Record Count)       |
+-------------------------------+-------------------------------------------------------------------+
```

---

## 2. Desktop Wireframe Architecture (1440px+)

### 2.1 Executive Overview Dashboard (`/admin`)

```
====================================================================================================
LOC MAISON ADMIN  [ Search properties, clients, requests... (Ctrl+K) ]  (🔔 3)  (⚡ Online)  [Admin]
====================================================================================================
 NAVIGATION    | Home / Dashboard Overview                                [ Filter Date: Last 30 Days ▾ ]
 --------------| ----------------------------------------------------------------------------------
 📊 Dashboard  | EXECUTIVE KPI SCORECARD
 🏡 Properties | +------------------+ +------------------+ +------------------+ +------------------+
    └ Pending   | | TOTAL REVENUE    | | ACTIVE BOOKINGS  | | MATCH RATE       | | UNRESOLVED REQ.  |
 📋 Requests   | | 42,850 TND       | | 128 Confirmed    | | 68.4% (+4.2%)   | | 14 Pending       |
 👥 Clients    | | +12.5% MoM       | | 18 Check-ins     | | (Target: 70%)    | | Urgent: 3        |
 📈 Analytics  | +------------------+ +------------------+ +------------------+ +------------------+
 📜 Audit Log  | 
 ⚙️ Settings   | OPERATIONAL SUMMARY & QUICK ACTIONS
               | +-----------------------------------------------+ +--------------------------------+
               | | URGENT HOUSING REQUESTS (NEEDS OWNER MATCH)   | | RECENT PLATFORM ACTIVITY       |
               | | [Search...] [Status: All ▾] [City: Tunis ▾]    | | ------------------------------ |
               | |-----------------------------------------------| | 🟢 New Request #REQ-892     |
               | | ID     | Client  | Budget    | Status | Action| | 🟡 Property #PROP-104 mod. |
               | | REQ-892| Mohamed | 1200 TND  | 🔴 New | [Match] | 🔴 Owner #OWN-44 unverified |
               | | REQ-889| Amira   | 2500 TND  | 🟡 Pend| [Match] | 🟢 Reservation #RES-12 paid |
               | | REQ-885| Karim   | 1800 TND  | 🟢 Done| [View] | +------------------------------+
               | +-----------------------------------------------+ | TRAFFIC SNAPSHOT (24H)         |
               |                                                   | Unique Visitors: 1,420         |
               |                                                   | Conversion: 4.8%               |
               |                                                   +--------------------------------+
---------------+------------------------------------------------------------------------------------
 System Status: Healthy | DB Latency: 18ms | Sync: Just now | Showing 1-10 of 14 requests
====================================================================================================
```

---

## 3. Operations Wireframes

### 3.1 Property Operations Console (`/admin/properties`)

```
====================================================================================================
 Dashboard / Property Management / Listings Catalog
====================================================================================================
 PROPERTIES MANAGEMENT                          [ + Add Property ]  [ 📥 Export CSV ]  [ 🔄 Refresh ]
 ---------------------------------------------------------------------------------------------------
 FILTERS: [ Search title, owner, address... ]  [ Type: All ▾ ]  [ Status: Pending Approval ▾ ] [City ▾]
 ---------------------------------------------------------------------------------------------------
  [✓] Image  | Title & Location       | Owner       | Price/Mo  | Status      | Created | Actions
 ---------------------------------------------------------------------------------------------------
  [ ] [📷]  | Villa Hammamet Beach   | Youssef B.  | 3,500 TND | 🟡 Pending  | 2h ago  | [Approve] [Reject] [...]
  [ ] [📷]  | Appartement S+2 La Marsa| Sonia K.    | 1,400 TND | 🟢 Active   | 1d ago  | [Pause] [Edit] [...]
  [ ] [📷]  | Studio Centre Ville    | Hamza T.    |   800 TND | 🔴 Rejected | 3d ago  | [Review] [Delete] [...]
 ---------------------------------------------------------------------------------------------------
 PAGE 1 OF 8  |  Showing 1-10 of 78 Properties  |  Items per page: [ 10 ▾ ]  |  [ < Prev ]  [ Next > ]
====================================================================================================
```

### 3.2 Detail Drawer / Inspection Panel Overlay (Slide-over from Right)

```
===============================================================================+
 PROPERTY INSPECTION & MODERATION                                         [ X ] |
 ===============================================================================|
 Villa Hammamet Beach (ID: #PROP-104)                                           |
 Status: 🟡 PENDING APPROVAL | Category: Villa | City: Nabeul / Hammamet        |
 -------------------------------------------------------------------------------|
 OWNER INFORMATION                                                              |
 Name: Youssef Ben Ali | Phone: +216 20 123 456 | Verified: 🟢 Yes               |
 -------------------------------------------------------------------------------|
 MEDIA & HIGHLIGHTS                                                             |
 [ Image 1 ] [ Image 2 ] [ Image 3 ] [ Image 4 ] (Total 8 Photos)              |
 Bedrooms: 4 | Bathrooms: 3 | Surface: 280 m² | Furnished: Yes                   |
 Monthly Rent: 3,500 TND | Security Deposit: 7,000 TND                          |
 -------------------------------------------------------------------------------|
 MODERATION ACTIONS                                                             |
 [ Reason for Rejection / Note: _____________________________________________ ]  |
                                                                                |
 [ 🟢 APPROVE LISTING ]   [ 🔴 REJECT LISTING ]   [ 💬 CONTACT OWNER ]         |
===============================================================================+
```

---

## 4. Mobile Responsive Layout Architecture (375px - 768px)

### 4.1 Mobile Header & Collapsible Drawer Navigation

On mobile screens, Level 2 (Sidebar) collapses into a slide-out drawer triggered by a top-left hamburger icon (`☰`). Tables automatically convert into stacked card lists to prevent horizontal overflow.

```
+-----------------------------------+
| ☰  LOC MAISON ADMIN     (🔔3) [👤]|
+-----------------------------------+
| Dashboard Overview                |
| [ Filter: Last 30 Days         ▾] |
+-----------------------------------+
| KPI SUMMARY (Swipe ↔)             |
| +-----------------+ +------------+|
| | TOTAL REVENUE   | | ACTIVE BOOK||
| | 42,850 TND      | | 128        ||
| +-----------------+ +------------+|
+-----------------------------------+
| URGENT REQUESTS                   |
| +---------------------------------+
| | REQ-892 - Mohamed S.            |
| | Budget: 1,200 TND/mo | Tunis    |
| | Status: 🔴 New | 10 mins ago    |
| | [ Action: Match Property ]      |
| +---------------------------------+
| | REQ-889 - Amira K.              |
| | Budget: 2,500 TND/mo | La Marsa |
| | Status: 🟡 Pending Match        |
| | [ Action: View Details ]        |
| +---------------------------------+
+-----------------------------------+
| Footer: Sync: Just now | Online   |
+-----------------------------------+
```

---

## 5. UI Layout Specifications & Grid Rules

1. **Grid Spacing & Containers**: Standardized 24px container padding (`p-6`) on desktop, 16px (`p-4`) on mobile. Gap between grid items is strictly 16px (`gap-4`) or 24px (`gap-6`).
2. **Density**: High data density using clean typography (`text-xs` for table headers/metadata, `text-sm` for table content, `text-2xl` for KPI metrics).
3. **Color Tokens**:
   - Background canvas: `#f8fafc` (Slate-50)
   - Card surfaces: `#ffffff` (White with border `#e2e8f0`)
   - Primary Accent: Indigo-600 (`#4f46e5`)
   - Success: Emerald-600 (`#059669`)
   - Warning/Pending: Amber-500 (`#f59e0b`)
   - Danger/Urgent: Rose-600 (`#e11d48`)

