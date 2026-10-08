# LOC MAISON — Phase 0 Project Baseline & Status Report

**Date:** October 8, 2026  
**Environment:** Next.js 15.5 (App Router), Node.js, MongoDB (Mongoose), Vitest, TailwindCSS v4  
**Git Branch:** `main`  
**Git Commit Baseline:** `670c474 fix: correct Cloudinary upload configuration` (with workspace fixes for build invariant & next config)

---

## 1. Quality & Verification Baseline Results

| Check | Command | Status | Notes |
|---|---|---|---|
| **Production Build** | `npm run build` | ✅ PASS | All 32 static/dynamic routes compiled successfully |
| **Code Linting** | `npm run lint` | ✅ PASS | 0 ESLint warnings, 0 errors |
| **Automated Tests** | `npm test` | ✅ PASS | 30 test files, 190 tests passed |

---

## 2. Environment Variables Specification

The application requires the following environment variables (secrets excluded):

| Variable Name | Required | Description / Default |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas / local URI (`mongodb://127.0.0.1:27017/location_match` fallback in dev) |
| `JWT_SECRET` | Yes | 32+ byte string used for JWT session token signing |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical public URL (e.g., `http://localhost:3000` or production domain) |
| `CLOUDINARY_URL` | Yes | Cloudinary server SDK connection string (`cloudinary://key:secret@cloudname`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name for direct signed client uploads |

---

## 3. MongoDB Connection & Database Architecture

- **Driver/ODM:** Mongoose v9.10
- **Connection Caching:** Global connection singleton with promise reuse (`src/lib/mongoose.ts`)
- **Timeout Configuration:** `serverSelectionTimeoutMS: 5000`, `bufferCommands: false`
- **Rate Limit Storage:** Dedicated MongoDB collection `rate_limits` via custom `MongoRateLimitStore` (`src/server/rate-limit/mongo-store.ts`)
- **Memory Server:** `mongodb-memory-server` v11 used for Vitest automated testing suite

---

## 4. Vercel & Deployment Infrastructure State

- **Deployment Platform:** Vercel (Next.js App Router Node serverless functions)
- **Tracing Root:** `outputFileTracingRoot: path.resolve(__dirname)` enforced in `next.config.ts` to prevent monorepo/workspace lockfile resolution conflicts
- **Image Optimization:** Remote pattern enabled for Cloudinary domain (`res.cloudinary.com`)
- **Build Target:** Next.js 15 App Router standard output

---

## 5. Known Feature Matrix (Working, Broken, & Incomplete)

### ✅ Working Features
- User Registration & Password Hashing (Customer / Owner roles)
- Owner Lifecycle authentication guards & rejection login handoffs
- Basic Property Creation (Draft vs Submit workflow)
- Direct Signed Image Uploads to Cloudinary
- Admin Review & Verification Workflow (Approve / Reject / Archive)
- Admin Reservation Status management
- Customer Contact Masking & Security Release guards
- Public Property Searching & Category Filters
- Cash Payment Reporting & Cross-User status synchronization

### ⚠️ Incomplete & Under-designed Features
- **Search System:** Lacks zero-result intelligent recommendations, missing map visualization, and complete date-range conflict checks
- **Owner Dashboard Analytics:** Contains prototype/unrefined dashboard components without real-time metrics pipeline
- **Marketplace Intelligence:** Analytics tracking exists but missing standardized event taxonomy, session attribution, and supply/demand intelligence
- **Location Hierarchy:** Hardcoded Mahdia locations without dynamic Governorate/City/Area database models
- **Payment Lifecycle:** Cash reporting flow works, but formal transaction gateway / Stripe / online payment lifecycle isn't integrated

---

## 6. Baseline Tag / Snapshot Verification

Baseline freeze tag: `v0.1.0-baseline` created on `main`.
