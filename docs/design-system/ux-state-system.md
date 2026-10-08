# LOC MAISON — TASK 19 Complete 9-State UX System Specification

**File Path:** `docs/design-system/ux-state-system.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. The 9 UX States Standard Architecture

Every asynchronous screen, table, grid, or mutation in LOC MAISON MUST explicitly handle all 9 states without collapsing them into a generic loading spinner or blank screen.

```text
                                Async Operation State
                                         │
        ┌───────────┬────────────┬───────┴───────┬────────────┬───────────┐
        ▼           ▼            ▼               ▼            ▼           ▼
     Loading     Success       Empty           Error     Unauthorized Forbidden
        │           │            │               │            │           │
    Skeleton    Real Data   Domain CTA     Retry Alert   Login Link   Access Alert
        
        Submitting ──────────► Disabled button + inline spinner
        Processing ──────────► Active status transition feedback
        Network Failure ─────► Connection interrupted alert + retry
```

---

## 2. State-by-State Specification & Behavioral Rules

| UX State | Visual Component Primitive | Trigger Condition | User Action / Outcome |
|---|---|---|---|
| **1. Loading** | `<SkeletonGrid />` / `<Skeleton />` | Initial fetch or query loading | Renders structural layout skeleton; no interaction allowed. |
| **2. Success** | `<AsyncStateContainer>` Render Prop | Query returns valid, non-empty data payload | Displays data grid/list. |
| **3. Empty** | `<EmptyState />` | Request succeeded but returned 0 items | Explains *what is empty*, *why*, and provides an *actionable CTA button*. |
| **4. Error** | `<ErrorState />` | Server error response (500) or query failure | Displays user-friendly error message with `onRetry` button. |
| **5. Network Failure** | `<NetworkErrorState />` | Client offline / network timeout | Displays connection error guidance with retry button. |
| **6. Unauthorized** | `<UnauthorizedState />` | Unauthenticated user accessing private route | Explains sign-in requirement with `Login` CTA button. |
| **7. Forbidden** | `<ForbiddenState />` | Role permissions guard failure (403) | Displays permission warning ("Accès refusé"). |
| **8. Submitting** | Inline Button Loader | Active form POST/PUT mutation | Disables submit button, renders inline spinner. |
| **9. Processing** | Active Progress Indicator | Async background task in progress | Displays status transition feedback ("Validation en cours..."). |
