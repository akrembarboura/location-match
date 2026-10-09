# LOC MAISON — Admin Information Architecture Proposal

**Audit Date:** October 9, 2026  
**Auditor:** Senior Product Architect & Engineering Team  
**Scope:** Reorganized administrative route map, navigation hierarchy, and module expansion plan for scale.

---

## 1. Executive Summary

To accommodate LOC MAISON's rapid marketplace expansion and the upcoming **Dynamic Commission & Financial Management System**, the admin information architecture has been restructured into **7 logical operational modules**. This architecture consolidates existing working pages while establishing clear expansion slots for financial tracking, owner payouts, and commission configuration.

---

## 2. Current vs Recommended Route Structure

```
CURRENT ROUTE MAP                       RECOMMENDED TARGET ROUTE MAP
-----------------                       ----------------------------
/admin                                  /admin (Vue d'ensemble)
├── /admin/requests                     ├── /admin/requests (Demandes & Workflow)
│   └── /admin/requests/[id]            │   └── /admin/requests/[id]
├── /admin/clients                      ├── /admin/clients (Fiches Clients & Contacts)
├── /admin/properties                   ├── /admin/properties (Biens & Catalogue)
│   └── /admin/properties/[id]          │   └── /admin/properties/[id]
├── /admin/analytics                    ├── /admin/finance (Finances & Commissions - NEW)
└── /admin/activities                   │   ├── /admin/finance/commissions
                                        │   └── /admin/finance/payouts
                                        ├── /admin/analytics (Statistiques & Funnels)
                                        └── /admin/activities (Journal & Audit)
```

---

## 3. Detailed Module Specifications

### Module 1: Overview & Operational Urgency (`/admin`)
- **Primary Focus:** Immediate action queue ("À traiter aujourd'hui"), high-level marketplace KPIs, status distribution bars, and visual inventory grid with dual-action property cards.
- **Key Actions:** Quick navigation to pending review properties, open requests, and unverified payment reports.

### Module 2: Housing Requests & Matchmaking (`/admin/requests`)
- **Primary Focus:** Management of customer rental requests (summer & student), status tabs (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`), proposal builder, and contract generation.
- **Key Actions:** Match proposed properties to client requests, approve/reject requests, view customer dossier.

### Module 3: Client Contacts & Directory (`/admin/clients`)
- **Primary Focus:** Centralized contact directory aggregating all customer inquiries and direct property reservation leads.
- **Key Actions:** Search clients by name, phone, budget, or destination; filter by direct vs general inquiry.

### Module 4: Property Moderation & Catalog (`/admin/properties`)
- **Primary Focus:** Property verification queue and full marketplace catalog.
- **Key Actions:** Moderation workflow (`UNDER_REVIEW`, `PUBLISHED`, `REJECTED`, `ARCHIVED`), scroll anchors (`#owner`, `#reservation`, `#analytics`), photo gallery verification.

### Module 5: Finances & Dynamic Commissions (`/admin/finance` — Target Phase)
- **Primary Focus:** Dynamic commission management, recorded cash transactions, outstanding owner balances, payout verification, and financial performance reports.
- **Key Actions:** Set commission tiers/rules, verify cash receipts, issue owner payouts, export financial audit logs.

### Module 6: Statistiques & Analytics (`/admin/analytics`)
- **Primary Focus:** First-party marketplace traffic, acquisition funnels, destination demand vs supply, property view counts, and conversion rates across time periods (7d, 30d, 90d, all).
- **Key Actions:** Period selector, conversion rate analysis, demand gap identification.

### Module 7: Journal & Activités (`/admin/activities`)
- **Primary Focus:** Platform activity stream, moderation event log, and administrative system notifications.
- **Key Actions:** Filter activities by type (Notifications, Modération, Demandes), audit admin actions.

---

## 4. Navigation Integrity & Transition Plan

1. **Zero Breaking Changes:** All 8 existing admin page routes remain fully active and accessible.
2. **Persistent Sidebar:** Sidebar state (`isCollapsed`) persists smoothly across all section transitions without page reload.
3. **Smooth Loading Primitives:** Navigation transitions display `<LoadingThreeDotsJumping />` inside content containers during data fetching.

