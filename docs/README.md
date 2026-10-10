# 📚 LOC MAISON — Technical Documentation Index

> 📌 **DOCUMENTATION HUB**
> - **Platform**: LOC MAISON (Tunisian Rental Marketplace)
> - **Stack**: Next.js 15 (App Router), React 19, TypeScript, MongoDB Atlas, Tailwind CSS, TanStack Query, Vitest
> - **Architecture**: Clean 4-Tier Architecture (Presentation → API Controllers → Services → Repositories → MongoDB)
> - **Notion Ready**: Optimized for direct import into Notion with callouts, toggle blocks, code snippets, and Mermaid diagrams.

---

## 📂 Navigation & Directory Map

```
docs/
├── README.md                               <-- [You Are Here] Master Index & Architecture Overview
├── frontend/                               <-- Frontend UI, Component System, & State Management
│   ├── UI_DESIGN_SYSTEM.md                 <-- Dar Mahdia Design System, Tailwind Tokens, & Component Cards
│   ├── UI_FLOWS_AND_STATE.md               <-- User Journeys, Client State, React 19, & Suspense Boundaries
│   └── FRONTEND_INTEGRATION_GUIDE.md       <-- API Client Hooks, Zod Form Validation, & Async Error Handling
├── backend/                                <-- Server Controllers, Domain Services, & Data Layer
│   ├── API_ARCHITECTURE_AND_ROUTES.md      <-- Next.js App Router API Routes & Response Conventions
│   ├── SERVICES_AND_REPOSITORIES.md        <-- Mongoose Models, Service Layer, & Strategy Pattern Engine
│   └── SECURITY_AUTH_RATE_LIMITING.md      <-- Auth Guards, RBAC Roles, OTP Verification, & Rate Limiting
├── architecture/                           <-- System Architecture & Financial Data Lifecycles
│   ├── SYSTEM_DESIGN_AND_FSM.md            <-- Clean Architecture & Stage A-F Finite State Machines
│   └── DATABASE_INDEXING_AND_SCALE.md      <-- Database Indexing, Pool Caching, & Scalability Roadmap
└── interview-masterclass/                  <-- Engineering Masterclass & Job Interview Prep
    └── MERN_STACK_INTERVIEW_GUIDE.md       <-- Pattern Cheat Sheets, Real Case Studies, & Senior Interview Q&A
```

---

## 🌟 Quick Links

| Category | File | Description |
| :--- | :--- | :--- |
| 🎨 **Frontend Design** | [`docs/frontend/UI_DESIGN_SYSTEM.md`](./frontend/UI_DESIGN_SYSTEM.md) | Front-office Dar Mahdia color tokens, typography, and card components. |
| 🔄 **Frontend State** | [`docs/frontend/UI_FLOWS_AND_STATE.md`](./frontend/UI_FLOWS_AND_STATE.md) | Client-side data fetching, TanStack Query, and React 19 `<Suspense>`. |
| 🔗 **API Client** | [`docs/frontend/FRONTEND_INTEGRATION_GUIDE.md`](./FRONTEND_INTEGRATION_GUIDE.md) | HTTP requests, Zod validation, and error state container integration. |
| ⚡ **API Routes** | [`docs/backend/API_ARCHITECTURE_AND_ROUTES.md`](./backend/API_ARCHITECTURE_AND_ROUTES.md) | Route handlers, request parsing, and unified JSON response format. |
| ⚙️ **Domain Services** | [`docs/backend/SERVICES_AND_REPOSITORIES.md`](./backend/SERVICES_AND_REPOSITORIES.md) | Repository pattern, Mongoose schemas, & dynamic precedence calculations. |
| 🔒 **Security & Auth** | [`docs/backend/SECURITY_AUTH_RATE_LIMITING.md`](./backend/SECURITY_AUTH_RATE_LIMITING.md) | JWT auth, RBAC permissions, OTP HMAC, and token bucket rate limits. |
| 🏛️ **System Architecture**| [`docs/architecture/SYSTEM_DESIGN_AND_FSM.md`](./architecture/SYSTEM_DESIGN_AND_FSM.md) | 4-Tier layering, Stage A → Stage F state machine, & immutable ledgers. |
| 🚀 **Scale & Database** | [`docs/architecture/DATABASE_INDEXING_AND_SCALE.md`](./architecture/DATABASE_INDEXING_AND_SCALE.md) | Compound indexing, connection pool management, and async queues. |
| 🎓 **Interview Prep** | [`docs/interview-masterclass/MERN_STACK_INTERVIEW_GUIDE.md`](./interview-masterclass/MERN_STACK_INTERVIEW_GUIDE.md) | Senior MERN design patterns, production case studies, & interview answers. |
