import { describe, it, expect, beforeEach } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import {
  HousingRequestModel,
  PropertyModel,
  CommissionSnapshotModel,
  FinancialLedgerModel,
  NotificationModel,
  UserModel,
} from "@/lib/models";
import { commissionPolicyService } from "@/server/services/CommissionPolicyService";
import { requestService } from "@/server/services/RequestService";
import { financeLedgerService } from "@/server/services/FinanceLedgerService";
import { ContactReleasePolicy } from "@/server/services/ContactReleasePolicy";

describe("LOC MAISON — Commission Negotiation, Collection & Confirmation Workflow", () => {
  beforeEach(async () => {
    await connectToDatabase();
    await HousingRequestModel.deleteMany({ id: { $regex: /^TEST-REQ/ } });
    await PropertyModel.deleteMany({ id: { $regex: /^TEST-PROP/ } });
    await CommissionSnapshotModel.deleteMany({ reservationId: { $regex: /^TEST-REQ/ } });
    await FinancialLedgerModel.deleteMany({ reservationId: { $regex: /^TEST-REQ/ } });
  });

  describe("1. Commission Calculation & Formula Integrity", () => {
    it("computes 60 TND commission for 8-month stay at 600 TND/month with FIRST_MONTH_RENT basis (10%)", () => {
      const monthlyRent = 600;
      const rate = 10;
      const commission = commissionPolicyService.calculateCommission(
        monthlyRent,
        rate,
        "PERCENTAGE",
        "FIRST_MONTH_RENT"
      );
      expect(commission).toBe(60);
      expect(commission).not.toBe(480); // Ensure total stay (8 * 600 * 10%) is NOT calculated
    });

    it("rejects invalid or out-of-range commission rates (>50% or negative)", () => {
      expect(() =>
        commissionPolicyService.calculateCommission(600, 55, "PERCENTAGE", "FIRST_MONTH_RENT")
      ).toThrow("Taux de commission invalide");

      expect(() =>
        commissionPolicyService.calculateCommission(600, -5, "PERCENTAGE", "FIRST_MONTH_RENT")
      ).toThrow("Taux de commission invalide");
    });

    it("ensures historical confirmed snapshots remain immutable when global settings change", async () => {
      const snapshot = await commissionPolicyService.createSnapshotAtConfirmation({
        reservationId: "TEST-REQ-IMMUTABLE-1",
        propertyId: "TEST-PROP-1",
        ownerId: "OWNER-1",
        rentalBasis: 700,
        rateOverride: 12,
        commissionBasis: "FIRST_MONTH_RENT",
        collectionFlow: "OWNER_DIRECT",
      });

      expect(snapshot.rate).toBe(12);
      expect(snapshot.calculatedCommission).toBe(84);

      // Attempt second creation call with different global policy / input
      const reFetched = await commissionPolicyService.createSnapshotAtConfirmation({
        reservationId: "TEST-REQ-IMMUTABLE-1",
        propertyId: "TEST-PROP-1",
        ownerId: "OWNER-1",
        rentalBasis: 1000,
        rateOverride: 20,
      });

      // Immutable snapshot retains original frozen rate & calculation
      expect(reFetched.rate).toBe(12);
      expect(reFetched.calculatedCommission).toBe(84);
    });
  });

  describe("2. End-to-End Negotiation & Confirmation Prerequisites Lifecycle", () => {
    it("executes complete Stage A -> Stage F workflow and enforces Stage F prerequisites", async () => {
      // Stage A: Create Request
      const reqDoc = await HousingRequestModel.create({
        id: "TEST-REQ-WORKFLOW-1",
        customer: { fullName: "Sami Ben Ali", phone: "+21698111222" },
        destination: "Mahdia",
        checkIn: "2026-07-01",
        checkOut: "2026-07-15",
        status: "PENDING",
        budget: 600,
        budgetPeriod: "month",
        propertyId: "TEST-PROP-WORKFLOW-1",
        selectedProperty: "TEST-PROP-WORKFLOW-1",
      });

      await PropertyModel.create({
        id: "TEST-PROP-WORKFLOW-1",
        title: "Appartement Mahdia Corniche",
        ownerId: "OWNER-WORKFLOW-1",
        status: "PUBLISHED",
        isPublished: true,
        pricePerNight: 80,
      });

      // Stage F check before Stage D & E must fail
      await expect(
        requestService.updateRequestStatus("TEST-REQ-WORKFLOW-1", "CONFIRMED", undefined, "admin-1")
      ).rejects.toThrow("les termes de la commission doivent d'abord être convenus");

      // Stage B: Customer Verification
      await requestService.recordCustomerVerification(
        "TEST-REQ-WORKFLOW-1",
        { status: "CONFIRMED", notes: "Dates et tarif confirmés avec le client" },
        "admin-1"
      );

      // Stage C: Owner Negotiation
      await requestService.recordOwnerNegotiation(
        "TEST-REQ-WORKFLOW-1",
        { status: "AGREED", proposedRate: 10, proposedBasis: "FIRST_MONTH_RENT", collectionFlow: "OWNER_DIRECT" },
        "admin-1"
      );

      // Stage D: Confirm Commission Terms (10% on 600 TND = 60 TND)
      await requestService.confirmCommissionTerms(
        "TEST-REQ-WORKFLOW-1",
        { rate: 10, basis: "FIRST_MONTH_RENT", rentalBasis: 600, collectionFlow: "OWNER_DIRECT" },
        "admin-1"
      );

      // Stage F check after Stage D but before Stage E payment verification must fail
      await expect(
        requestService.updateRequestStatus("TEST-REQ-WORKFLOW-1", "CONFIRMED", undefined, "admin-1")
      ).rejects.toThrow("le paiement de la commission doit d'abord être vérifié");

      // Stage E: Record Commission Payment (REPORTED)
      await requestService.recordCommissionPayment(
        "TEST-REQ-WORKFLOW-1",
        { amount: 60, paymentMethod: "CASH", reference: "REF-60-TND" },
        { userId: "admin-1", role: "ADMIN" }
      );

      const reqAfterReport = await HousingRequestModel.findOne({ id: "TEST-REQ-WORKFLOW-1" }).lean();
      expect(reqAfterReport.negotiation.paymentVerification.status).toBe("REPORTED");

      // Stage E: Admin Verifies Payment (VERIFIED)
      await requestService.verifyCommissionPayment(
        "TEST-REQ-WORKFLOW-1",
        { verifiedAmount: 60 },
        "admin-1"
      );

      const reqAfterVerif = await HousingRequestModel.findOne({ id: "TEST-REQ-WORKFLOW-1" }).lean();
      expect(reqAfterVerif.negotiation.paymentVerification.status).toBe("VERIFIED");

      // Stage F: Now updateRequestStatus("CONFIRMED") succeeds!
      const confirmedReq = await requestService.updateRequestStatus(
        "TEST-REQ-WORKFLOW-1",
        "CONFIRMED",
        undefined,
        "admin-1"
      );

      expect(confirmedReq.status).toBe("CONFIRMED");

      // Verify property reservation was locked
      const updatedProp = await PropertyModel.findOne({ id: "TEST-PROP-WORKFLOW-1" }).lean();
      expect(updatedProp.availabilityStatus).toBe("RESERVED");

      // Verify party notifications were generated
      const ownerNotif = await NotificationModel.findOne({
        requestId: "TEST-REQ-WORKFLOW-1",
        recipientRole: "OWNER",
      }).lean();
      expect(ownerNotif).toBeDefined();
      expect(ownerNotif.title).toBe("Réservation confirmée");
    });

    it("allows reservation confirmation when commission is explicitly WAIVED", async () => {
      await HousingRequestModel.create({
        id: "TEST-REQ-WAIVED-1",
        customer: { fullName: "Aymen Mansour", phone: "+21697000111" },
        destination: "Mahdia",
        checkIn: "2026-08-01",
        checkOut: "2026-08-10",
        status: "PENDING",
        budget: 500,
        propertyId: "TEST-PROP-WAIVED-1",
        selectedProperty: "TEST-PROP-WAIVED-1",
      });

      await PropertyModel.create({
        id: "TEST-PROP-WAIVED-1",
        title: "Studio Hiboun",
        ownerId: "OWNER-WAIVED-1",
        status: "PUBLISHED",
        isPublished: true,
      });

      // Confirm terms with waiver
      await requestService.confirmCommissionTerms(
        "TEST-REQ-WAIVED-1",
        { rate: 0, basis: "FIRST_MONTH_RENT", rentalBasis: 500, waivedReason: "Offre promotionnelle partenaire" },
        "admin-1"
      );

      // Now Stage F confirmation succeeds because commission was waived
      const confirmedReq = await requestService.updateRequestStatus(
        "TEST-REQ-WAIVED-1",
        "CONFIRMED",
        undefined,
        "admin-1"
      );

      expect(confirmedReq.status).toBe("CONFIRMED");
    });
  });

  describe("3. Contact Access Security & Masking Invariants", () => {
    it("keeps customer contact details HIDDEN when payment is UNPAID or REPORTED, releasing only when VERIFIED", () => {
      // 1. Unconfirmed reservation -> HIDDEN
      const evalUnconfirmed = ContactReleasePolicy.evaluate({
        reservationStatus: "PENDING",
        paymentStatus: "UNPAID",
        isAuthorizedOwner: true,
      });
      expect(evalUnconfirmed.visible).toBe(false);
      expect(evalUnconfirmed.contactVisibility).toBe("HIDDEN");

      // 2. Confirmed reservation with REPORTED payment -> HIDDEN
      const evalReported = ContactReleasePolicy.evaluate({
        reservationStatus: "CONFIRMED",
        paymentStatus: "REPORTED",
        isAuthorizedOwner: true,
      });
      expect(evalReported.visible).toBe(false);
      expect(evalReported.contactVisibility).toBe("HIDDEN");

      // 3. Confirmed reservation with VERIFIED payment -> RELEASED
      const evalVerified = ContactReleasePolicy.evaluate({
        reservationStatus: "CONFIRMED",
        paymentStatus: "VERIFIED",
        isAuthorizedOwner: true,
      });
      expect(evalVerified.visible).toBe(true);
      expect(evalVerified.contactVisibility).toBe("RELEASED");
    });
  });
});
