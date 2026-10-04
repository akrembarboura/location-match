# LOC MAISON

### Tunisian Rental Marketplace

LOC MAISON is a Tunisian rental marketplace designed to make property discovery and rental requests simpler, safer, and more human.

The platform connects **customers, property owners, and the LOC MAISON team** through a structured rental workflow covering property discovery, owner listings, customer requests, proposals, reservation coordination, and concierge support.

The initial market focus is **Mahdia, Tunisia**, with an architecture designed to scale progressively to additional cities and regions.

**Developed by [Micro Edition](https://microedition.tn/)**
**Founder & Project Lead — Akrem Barboura**

---

## Overview

LOC MAISON is built around a **human-assisted rental marketplace model** rather than a fully automated instant-booking platform.

The platform allows customers to:

* Discover verified rental properties.
* Search and filter properties according to their needs.
* View detailed property information, photos, pricing, and availability.
* Submit rental requests.
* Receive property proposals from the LOC MAISON team.
* Confirm a rental through the platform's reservation workflow.
* Communicate with the LOC MAISON concierge through supported channels.

Property owners can:

* Create and manage property listings.
* Submit properties for review.
* Upload property photographs.
* Manage property information and pricing.
* Monitor their listings and rental activity.

The LOC MAISON team manages the operational layer between customers and owners, including property review, matching, proposals, reservation coordination, and customer support.

---

# Business Model

LOC MAISON initially focuses on two major rental markets in Mahdia.

### Summer Rentals

The primary marketplace category focuses on seasonal vacation rentals.

Customers can discover:

* Villas
* Houses
* Apartments
* Studios
* Beachfront properties
* Properties near tourist areas
* Properties suitable for families and groups

Listings are presented with pricing in **Tunisian Dinars (TND)** and authentic property photography.

### Student Housing

LOC MAISON also provides a dedicated category for students looking for practical and affordable accommodation during the academic year.

The student housing model can later support additional features such as:

* Long-term rental requests
* Student-specific filters
* Monthly pricing
* University-area search
* Student payment options
* Dedicated student workflows

### Property Owners

Property owners receive a dedicated portal where they can:

* Create property listings.
* Upload property images.
* Edit property information.
* Submit properties for review.
* Monitor listing status.
* Manage their rental inventory.

---

# Marketplace Workflow

LOC MAISON uses a structured workflow designed to keep the marketplace controlled and reduce fraudulent or conflicting reservations.

```text
Property Owner
      │
      ▼
Create Property Listing
      │
      ▼
LOC MAISON Review
      │
      ├── Rejected
      │
      └── Approved
             │
             ▼
        Published Property
             │
             ▼
          Customer
             │
             ▼
       Rental Request
             │
             ▼
     LOC MAISON Matching
             │
             ▼
          Proposal
             │
             ▼
     Customer Acceptance
             │
             ▼
 Reservation Confirmation
             │
             ▼
 LOC MAISON Concierge Support
```

This approach allows the platform to maintain operational control while the marketplace is being established.

---

# Core Features

## Property Discovery

Customers can browse rental properties through a dedicated property discovery experience.

Supported capabilities include:

* Property categories
* Location filtering
* Guest capacity
* Rental dates
* Property type
* Pricing
* Property details
* Property photography
* Availability status

The primary public property route is:

```text
/houses
```

Individual properties are accessible through SEO-friendly slugs:

```text
/houses/[slug]
```

---

## Property Listings

Each property can contain structured information such as:

* Title
* Description
* Location
* Property type
* Capacity
* Bedrooms
* Bathrooms
* Amenities
* Pricing
* Availability
* Property images
* Cover image
* Publication status

Property lifecycle:

```text
DRAFT
   ↓
PENDING_REVIEW
   ↓
PUBLISHED
   ↓
ARCHIVED

or

PENDING_REVIEW
   ↓
REJECTED
```

Availability is handled independently from publication status to prevent mixing content moderation with reservation state.

---

# User Roles

LOC MAISON uses role-based access control with four roles.

### CUSTOMER

Customers can:

* Create an account.
* Browse properties.
* Submit rental requests.
* View their requests.
* View received proposals.
* Manage their customer dashboard.

### OWNER

Property owners can:

* Manage their properties.
* Create new listings.
* Upload property images.
* Edit existing listings.
* Monitor listing status.
* Access their owner dashboard.

### ADMIN

Administrators manage the marketplace operationally.

Admin capabilities include:

* Property moderation
* Customer management
* Owner management
* Rental request management
* Proposal management
* Marketplace monitoring
* Operational workflows

### SUPER_ADMIN

Super administrators have the administrative permissions required for platform-level operations.

---

# Application Routes

The platform follows a role-based route structure.

## Public

```text
/
 /houses
 /houses/[slug]
 /properties
 /properties/[id]
 /summer
 /student
 /request/summer
 /request/student
 /login
 /register
```

Both `/houses` and `/properties` currently have public listing pages. `/houses/[slug]`
and `/properties/[id]` are separate detail routes; `/properties` does not redirect to `/houses`.

## Customer

```text
/dashboard
/request/[id]
```

## Owner

```text
/owner
/owner/list-property
/owner/properties/[id]
/owner/properties/new
/owner/properties/[id]/edit
```

## Admin

```text
/admin
/admin/analytics
/admin/properties
/admin/requests
/admin/properties/[id]
```

---

# Technology Stack

LOC MAISON is built with a modern TypeScript-based web stack.

| Layer            | Technology                                          |
| ---------------- | --------------------------------------------------- |
| Framework        | [Next.js 15](https://nextjs.org/)                   |
| UI Library       | [React 19](https://react.dev/)                      |
| Language         | [TypeScript](https://www.typescriptlang.org/)       |
| Styling          | [Tailwind CSS v4](https://tailwindcss.com/)         |
| UI Architecture  | Radix UI / shadcn-style components                  |
| Animations       | [Framer Motion](https://motion.dev/)                |
| Database         | MongoDB                                             |
| ODM              | Mongoose                                            |
| Data Fetching    | [TanStack Query](https://tanstack.com/query/latest) |
| Validation       | [Zod](https://zod.dev/)                             |
| Forms            | [React Hook Form](https://react-hook-form.com/)     |
| Authentication   | JWT / `jose`                                        |
| Password Hashing | `bcryptjs`                                          |
| Image Storage    | Cloudinary                                          |
| Icons            | Lucide React                                        |
| Carousel         | Embla Carousel                                      |
| Testing          | Vitest / Testing Library                            |

---

# Architecture

The application uses the **Next.js App Router** with a separation between presentation, application logic, and server-side business logic.

A simplified architecture:

```text
Next.js Application
│
├── App Router
│   ├── Public Routes
│   ├── Customer Routes
│   ├── Owner Routes
│   └── Admin Routes
│
├── Components
│   ├── UI
│   ├── Forms
│   ├── Property
│   ├── Dashboard
│   └── Site
│
├── Client Data Layer
│   └── TanStack Query
│
├── Server Layer
│   ├── Authentication
│   ├── Properties
│   ├── Requests
│   ├── Proposals
│   ├── Notifications
│   └── Rate Limiting
│
├── Database
│   └── MongoDB / Mongoose
│
└── External Services
    ├── Cloudinary
    └── Communication / Concierge Services
```

The architecture is intentionally designed so the marketplace can evolve without coupling the user interface directly to database operations.

---

# Authentication & Security

Authentication is implemented using signed JWT sessions stored in secure HTTP-only cookies.

### Session Cookie

```text
loc_maison_session
```

Production configuration includes:

* HTTP-only cookies
* `SameSite=Lax`
* `Secure` cookies in production
* Server-side session verification
* JWT expiration
* Role-based authorization

JWT claims include information required to identify the authenticated session, such as:

```text
sub
role
email
iat
exp
```

Passwords are never stored in plaintext and are hashed using `bcryptjs`.

---

# Rate Limiting

Sensitive endpoints are protected by server-side rate limiting.

Rate limiting is used for areas such as:

* Authentication
* Login attempts
* Session-related endpoints
* Abuse-sensitive API operations

Rate-limit state is stored in MongoDB and uses expiration mechanisms to prevent permanent accumulation.

---

# Database

LOC MAISON uses **MongoDB with Mongoose**.

The current core domain model includes collections for:

```text
users
properties
requests
proposals
notifications
rate_limits
```

The database design separates marketplace entities so that future functionality can be introduced without restructuring the entire application.

---

# Property Media

Property images are stored and delivered through **Cloudinary**.

Property media supports:

* Multiple images per property
* Cover image selection
* Responsive image delivery
* Image optimization
* WebP / JPEG / PNG formats
* Upload size restrictions
* Cloud-hosted media delivery

Property records store Cloudinary references rather than relying on local filesystem storage.

---

# Validation

User input is validated using **Zod**.

Validation is applied across important application boundaries, including:

* Authentication
* Registration
* Property creation
* Property editing
* Rental requests
* Proposals
* API inputs

React Hook Form is used on the client side for structured form handling while server-side validation remains authoritative.

---

# Data Fetching & Client State

LOC MAISON uses **TanStack Query** for server-state management.

This provides:

* Query caching
* Request deduplication
* Loading states
* Error handling
* Query invalidation
* Mutation management
* Controlled client/server data synchronization

The application avoids treating server data as ordinary global UI state.

---

# Internationalization

The initial customer-facing experience is designed primarily in **French**.

The application uses structured translation dictionaries, allowing additional languages to be introduced later without rebuilding the UI architecture.

Current localization direction:

```text
French
  ↓
Future multilingual support
  ├── English
  └── Arabic
```

The initial focus remains a clear French experience for the Tunisian market and Tunisian diaspora.

---

# Responsive Design

LOC MAISON follows a mobile-first design approach.

The interface is designed for:

* Smartphones
* Tablets
* Desktop browsers

The marketplace experience prioritizes mobile usability because property discovery, communication, and rental requests are expected to occur frequently through mobile devices.

---

# Project Structure

The Next.js App Router is at the repository root. Shared components and server-side
application code live under `src/`.

```text
app/
├── admin/
├── api/
├── houses/
├── owner/
├── properties/
├── request/
└── ...

src/
├── components/
├── hooks/
├── lib/
├── server/
└── ...
```

The exact structure may evolve as the marketplace domains grow.

---

# Development

## Requirements

Before starting development, make sure the environment includes:

* Node.js
* npm, pnpm, or Yarn
* MongoDB
* Cloudinary account for media functionality

---

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Or:

```bash
pnpm install
```

Or:

```bash
yarn install
```

---

## Environment Variables

For local development, create an environment file:

```bash
cp .env.example .env.local
```

Configure the required values locally. For Vercel, add production values under
**Project Settings → Environment Variables** and select the **Production** environment:

```env
MONGODB_URI=<full Atlas connection string>
JWT_SECRET=<random secret of at least 32 bytes>
NEXT_PUBLIC_APP_URL=https://your-production-domain
CLOUDINARY_URL=<Cloudinary URL containing API credentials>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
```

`MONGODB_URI` must be a complete Atlas connection string using a MongoDB database
user's credentials, not only the password. URL-encode special characters in the password.
Keep `JWT_SECRET` stable between deployments so existing sessions remain valid.
`CLOUDINARY_URL` contains private credentials and must be stored as a secret; the cloud
name is public configuration.

After changing environment variables in Vercel, redeploy so the new deployment receives
the updated values. Local MongoDB data is separate from Atlas and is not copied to production.

### Initial Production Admin

Public registration assigns new accounts the `CUSTOMER` role. To grant admin access,
register the trusted account on the production site, then have an authorized database
operator update only that account's `role` field to `ADMIN` in the production database's
`users` collection. Sign out and back in after the change so a fresh session receives the
updated role. Never promote an account you do not control.

Do not use `create-admin.ts` against production: it contains hard-coded default admin
credentials intended only for local development.

### Security

Never commit:

* Database credentials
* JWT secrets
* Cloudinary private credentials
* API keys
* Production tokens
* User credentials

Production secrets must be configured through the hosting provider's secure environment-variable system.

---

# Development Server

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

---

# Quality & Testing

Before deploying changes, run the project's verification commands:

```bash
npm test
npm run lint
npm run build
```

The production build should pass TypeScript and ESLint validation before deployment.

The project also includes automated tests covering important application and domain behavior.

---

# Production Considerations

LOC MAISON is designed with production deployment in mind.

Before a public launch, production infrastructure should include:

* MongoDB Atlas with appropriate backups
* Secure production environment variables
* HTTPS
* Cloudinary production configuration
* Authentication security controls
* API rate limiting
* Error monitoring
* Application logging
* Analytics
* Cookie/privacy compliance
* Database backup strategy
* Operational communication channels

Production infrastructure should be configured separately from local development environments.

---

# Roadmap

LOC MAISON is being developed incrementally.

### Current Focus

* Property marketplace
* Customer rental requests
* Owner property management
* Admin moderation
* Proposal workflow
* Authentication and authorization
* Property media management
* Marketplace analytics
* Concierge communication

### Planned Improvements

* Reservation confirmation workflow
* Owner availability calendar
* Property verification badges
* Advanced marketplace analytics
* Online payment support
* D17 / local payment integrations
* Improved student housing workflows
* Additional locations across Tunisia
* Mobile application
* Advanced notification infrastructure
* Expanded multilingual support

---

# Product Vision

LOC MAISON aims to become a trusted digital rental marketplace built specifically around the realities of the Tunisian market.

The long-term vision is not simply to provide another property listing website.

The platform aims to combine:

```text
Property Discovery
        +
Verified Listings
        +
Structured Rental Requests
        +
Human Concierge
        +
Secure Digital Infrastructure
```

The objective is to make renting property in Tunisia **clearer, safer, and easier for both customers and owners**.

---

# Company

**Micro Edition**

Website: [microedition.tn](https://microedition.tn/)

**LOC MAISON**
Tunisian Rental Marketplace

**Founder & Project Lead:** Akrem Barboura

---

# License & Intellectual Property

LOC MAISON is a **proprietary and confidential commercial project** developed by Micro Edition.

The source code, business logic, product architecture, branding, database structure, design system, and associated assets are not licensed for redistribution, resale, or unauthorized commercial use.

Unless explicitly authorized in writing by the project owner, no part of this project may be:

* Reproduced
* Distributed
* Resold
* Modified for commercial redistribution
* Rebranded
* Republished
* Used as the foundation of another commercial marketplace

© 2026 Micro Edition. All rights reserved.
