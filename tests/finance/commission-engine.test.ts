import { describe, it, expect, beforeEach, afterEach } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import { CommissionPolicyModel, CommissionSnapshotModel, FinancialLedgerModel } from "@/lib/models";
import { commissionPolicyService } from "@/server/services/CommissionPolicyService";
import { financeLedgerService } from "@/server/services/FinanceLedgerService";

describe("LOC MAISON — Finance & Dynamic Commission Engine", () => {
  beforeEach(async () => {
    await connectToDatabase();
    await CommissionPolicyModel.deleteMany({});
    await CommissionSnapshotModel.deleteMany({});
    await FinancialLedgerModel.deleteMany({});
  });

  afterEach(async () => {
    await CommissionPolicyModel.deleteMany({});
    await CommissionSnapshotModel.deleteMany({});
    await FinancialLedgerModel.deleteMany({});
  });

  it("1. Resolves default platform policy (10%) when no overrides exist", async () => {
    const { policy, source } = await commissionPolicyService.resolvePolicy({
      reservationId: "RES-101",
      propertyId: "PROP-101",
      ownerId: "OWN-101",
    });

    expect(source).toBe("PLATFORM");
    expect(policy.rate).toBe(10);
  });

  it("2. Respects precedence rules (Reservation > Property > Owner > Platform)", async () => {
    // Create owner policy (12%)
    await commissionPolicyService.savePolicy({
      name: "Owner Policy",
      scope: "OWNER",
      targetId: "OWN-101",
      rate: 12,
    });

    let result = await commissionPolicyService.resolvePolicy({
      ownerId: "OWN-101",
      propertyId: "PROP-101",
    });
    expect(result.source).toBe("OWNER");
    expect(result.policy.rate).toBe(12);

    // Create property policy (15%)
    await commissionPolicyService.savePolicy({
      name: "Property Policy",
      scope: "PROPERTY",
      targetId: "PROP-101",
      rate: 15,
    });

    result = await commissionPolicyService.resolvePolicy({
      ownerId: "OWN-101",
      propertyId: "PROP-101",
    });
    expect(result.source).toBe("PROPERTY");
    expect(result.policy.rate).toBe(15);

    // Create reservation policy (8%)
    await commissionPolicyService.savePolicy({
      name: "Reservation Override",
      scope: "RESERVATION",
      targetId: "RES-999",
      rate: 8,
    });

    result = await commissionPolicyService.resolvePolicy({
      reservationId: "RES-999",
      ownerId: "OWN-101",
      propertyId: "PROP-101",
    });
    expect(result.source).toBe("RESERVATION");
    expect(result.policy.rate).toBe(8);
  });

  it("3. Performs decimal-safe calculations for TND millimes", () => {
    // 1250.750 TND rent @ 10% = 125.075 TND
    const comm = commissionPolicyService.calculateCommission(1250.75, 10);
    expect(comm).toBe(125.075);
  });

  it("4. Rejects out-of-range or invalid commission rates", async () => {
    expect(() => commissionPolicyService.calculateCommission(1000, -5)).toThrow();
    expect(() => commissionPolicyService.calculateCommission(1000, 60)).toThrow();

    await expect(
      commissionPolicyService.savePolicy({
        name: "Bad Policy",
        scope: "PLATFORM",
        rate: 55,
      })
    ).rejects.toThrow();
  });

  it("5. Creates immutable commission snapshot at confirmation and handles repeated confirmation idempotently", async () => {
    const snap1 = await commissionPolicyService.createSnapshotAtConfirmation({
      reservationId: "RES-IDEMP-1",
      propertyId: "PROP-1",
      ownerId: "OWN-1",
      rentalBasis: 2000,
      collectionFlow: "OWNER_DIRECT",
    });

    expect(snap1.calculatedCommission).toBe(200);

    // Updating platform policy should NOT change existing snapshot!
    await commissionPolicyService.savePolicy({
      name: "New Platform Default 15%",
      scope: "PLATFORM",
      rate: 15,
    });

    const snap2 = await commissionPolicyService.createSnapshotAtConfirmation({
      reservationId: "RES-IDEMP-1",
      propertyId: "PROP-1",
      ownerId: "OWN-1",
      rentalBasis: 2000,
      collectionFlow: "OWNER_DIRECT",
    });

    expect(snap2.calculatedCommission).toBe(200); // Remained 200, NOT 300!
    expect(snap2.id).toBe(snap1.id);
  });

  it("6. Distinguishes expected obligations from reported and verified cash in ledger", async () => {
    const res = { id: "RES-LEDGER-1", propertyId: "P1", ownerId: "O1", customerId: "C1" };
    const snapshot = { calculatedCommission: 150, collectionFlow: "OWNER_DIRECT", currency: "TND" };

    // 1. Post obligation
    await financeLedgerService.postCommissionObligation(res, snapshot);

    let overview = await financeLedgerService.getFinancialOverview();
    expect(overview.commissionEarned).toBe(150);
    expect(overview.commissionCollected).toBe(0);
    expect(overview.commissionOutstanding).toBe(150);

    // 2. Owner reports 150 TND remittance
    const tx = await financeLedgerService.recordPaymentTransaction({
      reservationId: "RES-LEDGER-1",
      propertyId: "P1",
      ownerId: "O1",
      type: "COMMISSION_REMITTANCE",
      direction: "CREDIT",
      amount: 150,
      status: "REPORTED",
    });

    overview = await financeLedgerService.getFinancialOverview();
    expect(overview.commissionEarned).toBe(150);
    expect(overview.commissionReported).toBe(150);
    expect(overview.commissionCollected).toBe(0); // Reported payment DOES NOT count as verified cash!

    // 3. Admin verifies transaction
    await financeLedgerService.verifyTransaction("ADMIN-1", tx.id);

    overview = await financeLedgerService.getFinancialOverview();
    expect(overview.commissionEarned).toBe(150);
    expect(overview.commissionCollected).toBe(150);
    expect(overview.commissionOutstanding).toBe(0);
  });

  it("7. Handles transaction reversal cleanly without destroying audit trail", async () => {
    const tx = await financeLedgerService.recordPaymentTransaction({
      reservationId: "RES-REV-1",
      propertyId: "P1",
      ownerId: "O1",
      type: "COMMISSION_REMITTANCE",
      direction: "CREDIT",
      amount: 100,
      status: "VERIFIED",
    });

    let overview = await financeLedgerService.getFinancialOverview();
    expect(overview.commissionCollected).toBe(100);

    // Reverse transaction
    await financeLedgerService.reverseTransaction("ADMIN-1", tx.id, "Payment returned due to bank error.");

    overview = await financeLedgerService.getFinancialOverview();
    expect(overview.commissionCollected).toBe(0);

    // Double reversal should be rejected
    await expect(
      financeLedgerService.reverseTransaction("ADMIN-1", tx.id, "Second reversal attempt")
    ).rejects.toThrow();
  });
});

