# LOC MAISON — Tunisian Rental Marketplace

> **Managed Rental Marketplace for Summer Vacation & Student Housing in Tunisia**  
> *Developed by [Micro Edition](https://microedition.tn/) · Founder & Lead: Akrem Barboura*

---

## 🌟 Overview

**LOC MAISON** is a managed, human-assisted rental marketplace built for the Tunisian real estate market (initiating in **Mahdia, Tunisia**). Unlike unmoderated instant-booking platforms, LOC MAISON integrates a structured operational layer where properties are verified, customer requests are matched, payments are audited, and contact details are released strictly under controlled business invariants.

The platform provides dedicated, role-scoped experiences for:
- **Customers**: Property discovery, structured rental requests, proposal comparison, live payment tracking, and concierge support.
- **Property Owners**: Listing submission, availability calendars, cash payment declarations, operational check-in/check-out schedules, and masked customer communications.
- **Administrators**: Moderation, user lifecycle review, payment verification, request proposals, and platform analytics.

---

## 🔐 Controlled Customer Contact Release Policy

To protect marketplace integrity and prevent off-platform bypass before reservation and payment validation, LOC MAISON enforces a **Server-Side Contact Masking & Release Engine** (`ContactReleasePolicy`).

```text
               Customer Contact Data (Phone, Email, WhatsApp)
                                    │
                                    ▼
                ┌───────────────────────────────────────┐
                │   Server-Side Evaluation Policy       │
                └───────────────────┬───────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │  Is Authorized Owner?                   │
               │  Is Reservation Status CONFIRMED?       │
               │  Is Payment State VERIFIED / REPORTED?  │
               └────────────────────┬────────────────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                   ▼                                 ▼
             NO (Default)                        YES (Satisfied)
   ┌──────────────────────────────┐  ┌──────────────────────────────┐
   │ Contact Status: HIDDEN       │  │ Contact Status: RELEASED     │
   │ Phone: null                  │  │ Phone: +216 22 123 456       │
   │ Name: "Mohamed A."           │  │ Name: "Mohamed Ben Ali"      │
   └──────────────────────────────┘  └──────────────────────────────┘
```

> **Security Invariant**: Unreleased contact data is stripped at the **API & Repository level**. It is never transferred to the browser or hidden via CSS, eliminating client-side inspection vulnerabilities.

---

## 💳 Dynamic Payment Workflow & Single Source of Truth

LOC MAISON implements a domain-driven payment state machine (`PaymentModel`) to track cash, bank transfer, D17, and online transactions with full audit trails.

### Conceptual Payment Model

```typescript
type PaymentMethod = "CASH" | "BANK_TRANSFER" | "D17" | "ONLINE" | "OTHER";

type PaymentStatus =
  | "PENDING"
  | "AWAITING_OWNER_CONFIRMATION"
  | "REPORTED"
  | "VERIFIED"
  | "CONFIRMED"
  | "REJECTED"
  | "REFUNDED";
```

### Owner Cash Confirmation & Audit Flow (`REPORTED` ≠ `VERIFIED`)

```text
Customer selects Cash Payment
             │
             ▼
Physical Cash Paid to Owner
             │
             ▼
Owner Clicks "Paiement reçu"  ──►  Payment.status = REPORTED (Owner Audit)
             │
             ▼
LOC MAISON Admin Audit        ──►  Payment.status = VERIFIED / CONFIRMED
             │
             ▼
Contact Released to Owner & Customer Sees "Paiement confirmé"
```

1. **Single Source of Truth**: Payment state is saved in MongoDB (`PaymentModel` + `ReservationModel.paymentSummary`) and synced to `HousingRequestModel`. Both Customer and Owner views consume the identical server state via [src/lib/payment-status.ts](file:///c:/Users/Akrem/Desktop/location_match/src/lib/payment-status.ts).
2. **Auditability**: When an owner confirms physical receipt of cash, `Payment.status` transitions to `REPORTED`. LOC MAISON platform admins verify the record to set `VERIFIED`, preserving a full audit log (`reportedBy`, `reportedAt`, `verifiedBy`, `verifiedAt`, `history`).

---

## 🔄 End-to-End Marketplace Workflow

```text
 Property Owner               LOC MAISON Platform             Customer
───────────────              ─────────────────────           ──────────
       │                               │                         │
       ├──► Create Listing (DRAFT) ───►│                         │
       │    Submit for Review          │                         │
       │                               ├──► Moderation & Publish │
       │                               │    (/houses)            │
       │                               │                         │
       │                               │◄── Submit Request ──────┤
       │                               │    (Summer/Student)     │
       │                               │                         │
       │◄── View Reservation (Masked) ─┤                         │
       │    Receive Physical Cash      │                         │
       ├──► Report Cash Payment ──────►│                         │
       │    (Status: REPORTED)         ├──► Admin Verification   │
       │                               │    (Status: VERIFIED)   │
       │                               │                         │
       │◄── Release Customer Contact ──┤                         │
       │    (Status: RELEASED)         ├──► Paiement confirmé ──►│
```

---

## 🏛️ Application Architecture & Tech Stack

LOC MAISON is built on the **Next.js 15 App Router** using TypeScript, React 19, and Tailwind CSS v4.

| Layer | Technology / Tool |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (Canonical Utility Classes) |
| **Icons & Motion** | Lucide React, Framer Motion |
| **Database & ODM** | MongoDB Atlas, Mongoose |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query/latest) |
| **Validation & Forms**| [Zod](https://zod.dev/), React Hook Form |
| **Authentication** | Signed JWT HTTP-Only Cookies (`jose`, `bcryptjs`) |
| **Media Hosting** | Cloudinary API |
| **Testing** | [Vitest](https://vitest.dev/) (26 Test Suites, 162 Tests) |
| **CI/CD** | GitHub Actions (`ci.yml`, `security.yml`) |

---

## 👥 User Roles & Access Control

- **`CUSTOMER`**: Default role for public registration. Can browse listings, submit requests, view proposals, track payment status, and access `/dashboard`.
- **`OWNER`**: Can list properties, manage availability calendars, declare received cash payments, view operational check-in/check-out schedules, and manage `/owner`.
- **`ADMIN`**: Platform operators who review property listings, generate proposals, audit payment reports, and manage user lifecycles.
- **`SUPER_ADMIN`**: Full platform management and administrative override capabilities.

---

## 🛣️ Application Routes

### Public Routes
- `/` — Marketplace landing page & search
- `/houses` — Verified property listings catalog
- `/houses/[slug]` — Individual property details & reservation request
- `/summer` — Seasonal vacation rental discovery
- `/student` — Dedicated student housing catalog
- `/request/summer` & `/request/student` — Structured rental request wizards
- `/login` & `/register` — Authentication forms

### Customer Routes
- `/dashboard` — Customer request dashboard & tracking
- `/request/[id]` — Detailed request tracking & payment status

### Owner Routes
- `/owner` — Owner overview & operational KPI summary
- `/owner/properties` — Property listing management
- `/owner/properties/new` — Listing creation wizard
- `/owner/properties/[id]/edit` — Property editing
- `/owner/calendar` — Availability calendar & check-in schedule
- `/owner/reservations` — Reservation list & cash payment declaration
- `/owner/payments` — Financial summaries & transaction logs

### Admin Routes
- `/admin` — Operational overview
- `/admin/properties` — Moderation queue (Approve / Review / Reject)
- `/admin/requests` — Customer request matching & proposal engine
- `/admin/analytics` — Marketplace performance metrics

---

## 🚦 Security & Protection Mechanisms

### 1. HTTP-Only Cookie Authentication
Signed JWT sessions stored in `loc_maison_session` HTTP-Only, `SameSite=Lax`, `Secure` (production) cookies.

### 2. MongoDB MongoStore Rate Limiting
Abuse protection enforced via server-side rate-limiting policies (`AUTH_LOGIN`, `AUTH_REGISTER`, `PUBLIC_API`, `OWNER_API`, `ADMIN_API`).

### 3. Role-Based Route Guards
Authorization guards (`requireOwnerAccess()`, `requireAdminAccess()`) prevent unauthorized role escalation.

### 4. Continuous Integration & Security Workflows
Automated testing and vulnerability scanning via GitHub Actions:
- **`.github/workflows/ci.yml`**: Runs `npx tsc --noEmit`, `npm run lint`, and `npm test` (Vitest).
- **`.github/workflows/security.yml`**: Dependency audit & secret scanning.

---

## 🛠️ Development & Environment Setup

### 1. Prerequisites
- **Node.js**: v20+
- **MongoDB**: Local MongoDB instance or Atlas connection
- **Cloudinary Account**: For property image hosting

### 2. Installation & Setup

```bash
# Clone repository
git clone https://github.com/akrembarboura/location-match.git
cd location-match

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 3. Environment Variables (`.env.local`)

```env
MONGODB_URI=mongodb://127.0.0.1:27017/location_match
JWT_SECRET=your_super_secret_jwt_key_at_least_32_bytes
NEXT_PUBLIC_APP_URL=http://localhost:3002

CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 4. Running Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3002`.

### 5. Running Quality & Verification Checks

```bash
# Type check TypeScript
npx tsc --noEmit

# Run Linter
npm run lint

# Run Unit & Integration Tests (Vitest)
npm test

# Build for Production
npm run build
```

---

## 📜 License & Intellectual Property

**LOC MAISON** is a proprietary commercial application developed by **Micro Edition**.  
© 2026 Micro Edition. All rights reserved.

- **Developer**: Micro Edition ([microedition.tn](https://microedition.tn/))
- **Founder & Lead**: Akrem Barboura
