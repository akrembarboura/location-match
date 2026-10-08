# LOC MAISON — Customer Request & Reservation Flow Specification

## 1. Overview & Objectives

The LOC MAISON customer request system allows users to express rental interest through two primary mechanisms:
1. **Property-Specific Reservation Request (`?propertyId=...`)**: Direct reservation request for an authoritative published property listing.
2. **General Search / Match Request (No `propertyId`)**: Flexible request for seasonal summer rentals or student university housing when no specific listing has been selected yet.

Both mechanisms share a unified backend service (`RequestService`) and data schema (`HousingRequestModel`), enforcing strict Tunisian phone normalization (`+216 XX XXX XXX`), standard lifecycle transitions, and zero-payment instant submission.

---

## 2. Step Wizard UX Architecture

To maximize conversion and minimize friction on mobile and desktop, request forms follow a **3-step progressive wizard**:

```text
┌────────────────────────────────────────────────────────┐
│  Step 1: Stay & Capacity (Dates / Guests / Property)   │
└───────────────────────────┬────────────────────────────┘
                            │ (Validates dates & capacity)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Step 2: Requirements & Preferences (Budget / Notes)   │
└───────────────────────────┬────────────────────────────┘
                            │ (Validates budget & amenities)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Step 3: Contact & Review (Phone / Name / Summary)     │
└───────────────────────────┬────────────────────────────┘
                            │ (Normalizes Tunisian phone & submits)
                            ▼
              /request/success?ref=REQ-YYYY-XXXX
```

### Step 1: Stay & Capacity
- **Summer / Direct Property**: `checkIn`, `checkOut`, `guests` count (validated against `maxCapacity`).
- **Student**: `destination`, `checkIn` date, `students` count.

### Step 2: Requirements & Preferences
- **Summer**: `propertyType`, `budget` (total or per week), `amenities` (Piscine, Climatisation, Vue mer, etc.), optional `message`.
- **Student**: `propertyType`, `genderPreference`, `budget` (per month), `prefs` (Wi-Fi, Machine à laver, Proche fac, etc.), optional `message`.

### Step 3: Contact & Review
- `fullName` (min 3 characters).
- `phone` with **live Tunisian phone normalization indicator** (`+216 XX XXX XXX`).
- `email` (optional).
- **Full Review Card**: Recapitulates selected dates, property/destination, total guests, budget, and preferences before final submission.

---

## 3. Tunisian Phone Normalization Protocol

All customer phone inputs are formatted using `normalizeTunisianPhone`:
- Accepted input formats: `22123456`, `22 123 456`, `+216 22 123 456`, `00216 22 123 456`, `73 123 456`, `98 123 456`.
- Internal canonical format stored in MongoDB: `+216XXXXXXXX` (E.164 without spaces).
- Real-time UI feedback helper: displays `✓ Format reconnu : +216 22 123 456` or `⚠️ Numéro tunisien invalide (8 chiffres attendus)`.

---

## 4. Post-Submission Confirmation Protocol (`/request/success`)

Upon successful API response:
1. Server returns `id` (e.g. `REQ-2026-X8A2`).
2. Router redirects to `/request/success?ref=REQ-2026-X8A2&name=...&dest=...&type=...`.
3. Screen displays:
   - Success checkmark & reference badge (`REQ-2026-X8A2`).
   - Summary of request parameters.
   - **Next Steps Timeline**:
     1. Availability verification with owner.
     2. Direct WhatsApp / Phone contact by LOC MAISON agent.
     3. Proposal review & final confirmation.
   - Direct tracking CTA link to `/request/[id]`.

---

## 5. Security & Privacy Boundaries

- **No Public Owner Contacts**: Property owner telephone numbers remain hidden until payment confirmation.
- **Client Request Tracking**: Public users can track their request status via `/request/[id]` without exposing internal `adminNotes` or third-party client details.
