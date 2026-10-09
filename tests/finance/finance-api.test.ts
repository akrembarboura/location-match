import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import { CommissionSnapshotModel, FinancialLedgerModel, ReservationModel } from "@/lib/models";
import { GET as getOverview } from "@/app/api/admin/finance/overview/route";
import { GET as getCommissions } from "@/app/api/admin/finance/commissions/route";
import { GET as getTransactions } from "@/app/api/admin/finance/transactions/route";
import { GET as getPolicies, POST as postPolicy } from "@/app/api/admin/finance/policies/route";
import { POST as runMigrate } from "@/app/api/admin/finance/migrate/route";
import { NextRequest } from "next/server";

vi.mock("@/server/utils/auth-guards", () => ({
  requireRole: vi.fn().mockResolvedValue({
    id: "admin-1",
    email: "admin@locmaison.tn",
    role: "ADMIN",
  }),
}));

describe("LOC MAISON — Admin Finance API Endpoints Integration", () => {
  beforeEach(async () => {
    await connectToDatabase();
    await CommissionSnapshotModel.deleteMany({});
    await FinancialLedgerModel.deleteMany({});
    await ReservationModel.deleteMany({});
  });

  afterEach(async () => {
    await CommissionSnapshotModel.deleteMany({});
    await FinancialLedgerModel.deleteMany({});
    await ReservationModel.deleteMany({});
  });

  it("1. GET /api/admin/finance/overview returns initial empty financial state", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/finance/overview");
    const res = await getOverview(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.overview).toBeDefined();
    expect(data.overview.commissionEarned).toBe(0);
    expect(data.overview.commissionCollected).toBe(0);
  });

  it("2. GET /api/admin/finance/commissions returns paginated snapshot items", async () => {
    await CommissionSnapshotModel.create({
      id: "SNAP-TEST-1",
      reservationId: "RES-TEST-1",
      rate: 10,
      rentalBasis: 1500,
      calculatedCommission: 150,
      collectionFlow: "OWNER_DIRECT",
      confirmedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/admin/finance/commissions?page=1&limit=10");
    const res = await getCommissions(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.items.length).toBe(1);
    expect(data.items[0].reservationId).toBe("RES-TEST-1");
    expect(data.items[0].calculatedCommission).toBe(150);
  });

  it("3. GET /api/admin/finance/transactions returns ledger items", async () => {
    await FinancialLedgerModel.create({
      id: "TX-TEST-1",
      reservationId: "RES-TEST-1",
      propertyId: "PROP-1",
      ownerId: "OWN-1",
      type: "COMMISSION_OBLIGATION",
      direction: "CREDIT",
      amount: 150,
      status: "VERIFIED",
    });

    const req = new NextRequest("http://localhost:3000/api/admin/finance/transactions");
    const res = await getTransactions(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.items.length).toBe(1);
    expect(data.items[0].amount).toBe(150);
  });

  it("4. POST /api/admin/finance/policies creates custom owner rate", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/finance/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Accord Special Proprietaire Karim",
        scope: "OWNER",
        targetId: "OWN-KARIM",
        rate: 12,
      }),
    });

    const res = await postPolicy(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.policy.rate).toBe(12);
    expect(data.policy.scope).toBe("OWNER");
  });

  it("5. POST /api/admin/finance/migrate executes dry-run backfill", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/finance/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true }),
    });

    const res = await runMigrate(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.report.dryRun).toBe(true);
  });
});

