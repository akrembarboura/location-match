# LOC MAISON — TASK 07 Customer Journey Mapping

**File Path:** `docs/user-journeys/customer-journey.md`  
**Date:** October 8, 2026  
**Auditor & Product Designer:** Antigravity AI  

---

## Complete Customer Funnel
`Home` ➔ `Search` ➔ `Results` ➔ `Property Detail` ➔ `Availability Check` ➔ `Contact Owner` ➔ `Housing Request` ➔ `Reservation` ➔ `Payment` ➔ `Review`

---

## Detailed Step-by-Step Breakdown

### Step 1: Home (`/`)
- **User Goal:** Discover vacation/student housing in Mahdia & coastal Tunisia, understand platform value prop.
- **User Action:** Arrive on landing page, browse featured properties, click search bar or category pills (Summer / Student).
- **System Response:** Render hero search bar, popular destinations, featured properties, and category filters.
- **Potential Friction:** Slow image loading, generic unlocalized copy, unclear category distinction.
- **Data Collected:** Anonymous Session ID, Referrer URL, Device Type, Client IP.
- **Analytics Event:** `PAGE_VIEW` (`page: "home"`).
- **Success Condition:** User interacts with search bar or clicks a featured property within 10 seconds.
- **Failure Condition:** Immediate bounce or exit.

---

### Step 2: Search Input (`/houses` or `/properties`)
- **User Goal:** Specify destination (e.g. Mahdia Zone Touristique), dates, guest count, and rental type.
- **User Action:** Input location, select check-in/check-out dates, pick guest count, select category pills.
- **System Response:** Auto-suggest locations, highlight available date ranges, validate input bounds.
- **Potential Friction:** Unresponsive date picker on mobile, missing auto-suggestions, ambiguous date formats.
- **Data Collected:** Search queries (destination, checkIn, checkOut, guests, rentalCategory).
- **Analytics Event:** `SEARCH_STARTED`, `FILTER_APPLIED`.
- **Success Condition:** Valid search payload submitted with at least location or category selected.
- **Failure Condition:** Search button disabled without clear validation error message.

---

### Step 3: Search Results (`/properties?city=...`)
- **User Goal:** Compare available properties by price, location, photos, and features.
- **User Action:** Scroll results, apply price/amenity filters, toggle grid/map view, click property card.
- **System Response:** Display paginated list of published properties matching query with price per night/week, cover photos, and location tags.
- **Potential Friction:** Empty search results ("0 résultats"), slow filter response, duplicate property listings.
- **Data Collected:** Result count, active filter parameters, page number, clicked property ID.
- **Analytics Event:** `SEARCH_SUBMITTED`, `ZERO_RESULTS_VIEWED` (if empty).
- **Success Condition:** User clicks on a property card to view detail page.
- **Failure Condition:** Zero-result page with no alternative recommendations, leading to session abandonment.

---

### Step 4: Property Detail (`/properties/[id]` or `/houses/[slug]`)
- **User Goal:** Inspect property photos, full description, capacity, precise amenities, pricing rules, and owner trust badge.
- **User Action:** Open photo gallery, inspect amenities, read reviews, select date range on reservation widget.
- **System Response:** Render full photo grid, price summary calculator, interactive availability calendar, host details, and primary CTA.
- **Potential Friction:** Low-resolution photos, hidden fee surprises, unverified owner badge, broken CTA button.
- **Data Collected:** Property ID, owner ID, view duration, gallery open count, favorite state.
- **Analytics Event:** `PROPERTY_VIEWED`, `PROPERTY_IMAGE_OPENED`, `PROPERTY_FAVORITED`.
- **Success Condition:** User selects dates and clicks primary CTA ("Demander une réservation" or "Contact Host").
- **Failure Condition:** User leaves page due to lack of photo clarity or missing availability info.

---

### Step 5: Availability Check
- **User Goal:** Confirm that target dates are open and calculate final total stay cost.
- **User Action:** Choose start and end dates on calendar picker.
- **System Response:** Verify date collision against `ReservationRepository`, calculate itemized pricing (subtotal, nights, currency TND).
- **Potential Friction:** Selected dates turn out unavailable after clicking, confusing pricing breakdown.
- **Data Collected:** Target checkIn, checkOut, total nights, calculated price total.
- **Analytics Event:** `AVAILABILITY_CHECKED`.
- **Success Condition:** Selected range is `AVAILABLE` and price breakdown is clearly rendered.
- **Failure Condition:** Date collision error returned (`409 Conflict`).

---

### Step 6: Contact Owner / Unmasking (`CONTACT_OWNER_CLICKED`)
- **User Goal:** Reach out to host for questions or request confirmation.
- **User Action:** Click "Contacter le propriétaire" or "Appeler le hôte".
- **System Response:** Evaluate `ContactReleasePolicy`. If unreleased, prompt customer to complete request/reservation; if released, display verified phone number.
- **Potential Friction:** Masked number without explanation of security release requirements.
- **Data Collected:** Property ID, Owner ID, Customer ID, Contact release status.
- **Analytics Event:** `CONTACT_OWNER_CLICKED`.
- **Success Condition:** Masked number revealed or customer seamlessly guided to rental request wizard.
- **Failure Condition:** Confusing security block without actionable guidance.

---

### Step 7: Housing Request Submission (`/request/[id]` or `/request/summer`)
- **User Goal:** Submit formal rental request with dates, guest details, budget, and special instructions.
- **User Action:** Enter full name, Tunisian phone number (+216), guest breakdown, submit form.
- **System Response:** Normalize phone format, create `HousingRequest` record (`status: PENDING`), send async notification to Admin & Owner.
- **Potential Friction:** Strict phone format rejection, tedious multi-page form, unconfirmed submission state.
- **Data Collected:** `fullName`, `phone`, `checkIn`, `checkOut`, `guests`, `budget`, `message`.
- **Analytics Event:** `REQUEST_STARTED`, `REQUEST_SUBMITTED`.
- **Success Condition:** Request created in DB and user redirected to confirmation page (`/request/success`).
- **Failure Condition:** Validation error on phone number or missing required fields.

---

### Step 8: Reservation Confirmation (`/api/customer/reservations`)
- **User Goal:** Convert accepted request/proposal into a locked reservation.
- **User Action:** Accept owner proposal or click "Confirmer la réservation".
- **System Response:** Create `Reservation` record (`status: PENDING`/`CONFIRMED`), block calendar dates for property, generate payment invoice.
- **Potential Friction:** Delay in owner response, double booking race condition.
- **Data Collected:** `reservationId`, `requestId`, `propertyId`, `checkIn`, `checkOut`, `pricing`.
- **Analytics Event:** `RESERVATION_CREATED`, `RESERVATION_CONFIRMED`.
- **Success Condition:** Calendar dates locked in `Property.unavailable` array, confirmation notification sent.
- **Failure Condition:** Overlapping reservation collision.

---

### Step 9: Payment (`CASH` / `ONLINE` / `D17`)
- **User Goal:** Settle booking deposit or cash payment upon check-in.
- **User Action:** Pay cash to owner or transfer deposit via D17/Bank, view payment receipt status.
- **System Response:** Log transaction in `Payment` collection, transition state (`UNPAID` ➔ `REPORTED` ➔ `VERIFIED`).
- **Potential Friction:** Lack of payment receipt confirmation, status mismatch between customer and owner view.
- **Data Collected:** `paymentId`, `amount`, `method`, `status`, `reportedAt`.
- **Analytics Event:** `PAYMENT_INITIATED`, `PAYMENT_SUCCEEDED`.
- **Success Condition:** Payment logged and verified, customer receives final booking voucher.
- **Failure Condition:** Payment marked rejected or reported cash unconfirmed by owner.

---

### Step 10: Review & Post-Stay Feedback
- **User Goal:** Share rating and review experience regarding property accuracy, cleanliness, and owner communication.
- **User Action:** Rate property (1-5 stars) and write text review after completed stay.
- **System Response:** Store `Review` record, re-calculate `Property.rating` and `Property.reviewCount`.
- **Potential Friction:** Complicated review form, non-verified guest spam reviews.
- **Data Collected:** `reviewId`, `rating`, `comment`, `createdAt`.
- **Analytics Event:** `REVIEW_SUBMITTED`.
- **Success Condition:** Review published on property detail page and owner notified.
- **Failure Condition:** Review submitted without completed reservation proof.
