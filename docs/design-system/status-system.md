# LOC MAISON — Centralized Status System & Visual Semantics

**File Path:** `docs/design-system/status-system.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Centralized Domain Status Mapping Matrix

All status badges across Public, Owner, and Admin portals MUST use centralized semantic color tokens and standardized French labels. Hardcoding arbitrary Tailwind colors per component is forbidden.

### 1.1 Property Lifecycle Statuses

| Database Status | Label (French) | Semantic Variant | Visual Styling |
|---|---|---|---|
| `DRAFT` | Brouillon | `muted` | `bg-muted text-muted-foreground border-border` |
| `PENDING_REVIEW` | En attente de validation | `warning` | `bg-amber-500/10 text-amber-700 border-amber-500/20` |
| `UNDER_REVIEW` | En cours d'examen | `warning` | `bg-amber-500/15 text-amber-800 border-amber-500/30` |
| `PUBLISHED` / `ACTIVE` | Publiée / Active | `success` | `bg-emerald-500/10 text-emerald-700 border-emerald-500/20` |
| `PAUSED` | Masquée temporairement | `warning` | `bg-orange-500/10 text-orange-700 border-orange-500/20` |
| `REJECTED` | Refusée | `destructive` | `bg-red-500/10 text-red-700 border-red-500/20` |
| `ARCHIVED` | Archivée | `muted` | `bg-slate-500/10 text-slate-600 border-slate-500/20` |

---

### 1.2 Housing Request & Proposal Statuses

| Database Status | Label (French) | Semantic Variant | Visual Styling |
|---|---|---|---|
| `PENDING` | En attente | `warning` | `bg-amber-500/10 text-amber-700 border-amber-500/20` |
| `PROPERTY_PROPOSED` | Proposition envoyée | `info` | `bg-sky-500/10 text-sky-700 border-sky-500/20` |
| `ACCEPTED` / `CONFIRMED` | Confirmée | `success` | `bg-emerald-500/10 text-emerald-700 border-emerald-500/20` |
| `REJECTED` | Refusée | `destructive` | `bg-red-500/10 text-red-700 border-red-500/20` |
| `CANCELLED` | Annulée | `muted` | `bg-slate-500/10 text-slate-600 border-slate-500/20` |
| `EXPIRED` | Expirée | `muted` | `bg-slate-500/10 text-slate-600 border-slate-500/20` |

---

### 1.3 Reservation & Payment Lifecycle Statuses

| Database Status | Label (French) | Semantic Variant | Visual Styling |
|---|---|---|---|
| `UNPAID` / `PENDING` | Non payé / En attente | `destructive` | `bg-red-500/10 text-red-700 border-red-500/20` |
| `REPORTED` | Signalé (Cash) | `info` | `bg-sky-500/10 text-sky-700 border-sky-500/20` |
| `VERIFIED` / `PAID` | Payé / Vérifié | `success` | `bg-emerald-500/10 text-emerald-700 border-emerald-500/20` |
| `REFUNDED` | Remboursé | `muted` | `bg-slate-500/10 text-slate-600 border-slate-500/20` |

