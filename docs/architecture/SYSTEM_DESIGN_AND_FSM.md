# 🏛️ LOC MAISON — System Architecture & State Machine Blueprint

> 📌 **DOCUMENT PROPERTIES**
> - **Category**: Enterprise Architecture & State Machine Design
> - **Stack**: Next.js 15, Clean Architecture, Finite State Machines (FSM), Immutable Accounting
> - **Authoritative Literature References**:
>   - 📚 *Clean Architecture: A Craftsman's Guide to Software Structure and Design* by Robert C. Martin ("Uncle Bob")
>   - 📚 *Enterprise Integration Patterns* by Gregor Hohpe & Bobby Woolf
>   - 📚 *Building Microservices* by Sam Newman

---

## 📌 Executive Summary

This document specifies the system architecture and state machine lifecycles of LOC MAISON. The application adopts **Clean 4-Tier Architecture** combined with **Guarded Finite State Machines** for multi-stage rental negotiation workflows.

---

## 🏗️ 1. Clean 4-Tier System Layering

```mermaid
flowchart TD
    subgraph UI ["1. Presentation Tier (Client UI)"]
        ReactComponents["React 19 / App Router Pages"]
        TanStackQuery["TanStack Query Cache"]
    end

    subgraph Controller ["2. Controller Tier (API Transport)"]
        RouteHandlers["Next.js Route Handlers (app/api/)"]
        AuthGuards["RBAC & Security Guards"]
        ZodValidation["Zod Runtime Schemas"]
    end

    subgraph Service ["3. Domain Service Tier (Business Rules)"]
        RequestService["RequestService (Stage A-F FSM)"]
        CommissionPolicyService["Commission Policy Precedence Engine"]
        AuthService["AuthService & OTP Engine"]
    end

    subgraph Data ["4. Persistence Tier (Data Access)"]
        Repositories["UserRepository / PropertyRepository / ReservationRepository"]
        MongooseModels["Mongoose Schemas (MongoDB Atlas)"]
    end

    ReactComponents --> RouteHandlers
    TanStackQuery --> RouteHandlers
    RouteHandlers --> AuthGuards
    AuthGuards --> ZodValidation
    ZodValidation --> RequestService
    ZodValidation --> CommissionPolicyService
    ZodValidation --> AuthService

    RequestService --> Repositories
    CommissionPolicyService --> Repositories
    AuthService --> Repositories
    Repositories --> MongooseModels
```

---

## 🔄 2. Finite State Machine (Stage A → Stage F Lifecycle)

To prevent race conditions, domain state transitions are strictly guarded by prerequisite validation:

```mermaid
stateDiagram-v2
    [*] --> StageA_RequestSubmitted: Client Submits Housing Request
    StageA_RequestSubmitted --> StageB_ClientVerified: Admin Validates Dates with Client
    StageB_ClientVerified --> StageC_OwnerNegotiated: Admin Negotiates Terms with Owner
    StageC_OwnerNegotiated --> StageD_TermsConfirmed: Commission Rate & Basis Locked
    StageD_TermsConfirmed --> StageE_PaymentVerified: Commission Payment Verified by Admin
    StageE_PaymentVerified --> StageF_Confirmed: Stage Prerequisites Satisfied
    StageF_Confirmed --> ContactReleased: Customer & Owner Contact Access Granted
```

---

## 📚 3. Engineering Literature References

- 📘 **Martin, R. C. (2017).** *Clean Architecture*. Boundaries, dependency inversion rule, and domain model protection.
- 📙 **Hohpe, G., & Woolf, B. (2003).** *Enterprise Integration Patterns*. Message routing, state management, and enterprise integration topologies.
