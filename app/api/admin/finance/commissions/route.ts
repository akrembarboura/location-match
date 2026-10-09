import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { CommissionSnapshotModel, PropertyModel, UserModel, ReservationModel, FinancialLedgerModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const flow = searchParams.get("flow");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (flow && flow !== "ALL") {
      query.collectionFlow = flow;
    }
    if (search) {
      query.$or = [
        { reservationId: { $regex: search, $options: "i" } },
        { policyId: { $regex: search, $options: "i" } },
      ];
    }

    const [snapshots, total] = await Promise.all([
      CommissionSnapshotModel.find(query).sort({ confirmedAt: -1 }).skip(skip).limit(limit).lean().exec(),
      CommissionSnapshotModel.countDocuments(query),
    ]);

    // Populate property and owner details
    const resIds = snapshots.map((s: any) => s.reservationId);
    const reservations = await ReservationModel.find({ id: { $in: resIds } }).lean().exec();
    const resMap = new Map(reservations.map((r: any) => [r.id, r]));

    const propIds = Array.from(new Set(reservations.map((r: any) => r.propertyId).filter(Boolean)));
    const properties = await PropertyModel.find({ id: { $in: propIds } }).select("id title city ownerId").lean().exec();
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    const ownerIds = Array.from(new Set(reservations.map((r: any) => r.ownerId).filter(Boolean)));
    const owners = await UserModel.find({ id: { $in: ownerIds } }).select("id firstName lastName phone").lean().exec();
    const ownerMap = new Map(owners.map((o: any) => [o.id, o]));

    // Batch fetch ledger payment status per reservation
    const ledgerTx = await FinancialLedgerModel.find({
      reservationId: { $in: resIds },
      type: "COMMISSION_REMITTANCE",
    }).lean().exec();

    const remittanceMap = new Map<string, { collected: number; reported: number }>();
    for (const tx of ledgerTx) {
      const current = remittanceMap.get(tx.reservationId) || { collected: 0, reported: 0 };
      if (tx.status === "VERIFIED") {
        current.collected += tx.amount;
      } else if (tx.status === "REPORTED") {
        current.reported += tx.amount;
      }
      remittanceMap.set(tx.reservationId, current);
    }

    const items = snapshots.map((s: any) => {
      const res = resMap.get(s.reservationId);
      const prop = res ? propMap.get(res.propertyId) : null;
      const owner = res ? ownerMap.get(res.ownerId) : null;
      const rem = remittanceMap.get(s.reservationId) || { collected: 0, reported: 0 };

      const verifiedCollected = rem.collected;
      const outstanding = Math.max(0, s.calculatedCommission - verifiedCollected);

      return {
        ...s,
        customerName: res?.customerName || "Client",
        propertyTitle: prop?.title || "Logement",
        propertyCity: prop?.city || "Mahdia",
        ownerName: owner ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim() : "Propriétaire",
        ownerPhone: owner?.phone || "",
        verifiedCollected,
        reportedAmount: rem.reported,
        outstandingAmount: outstanding,
      };
    });

    return NextResponse.json({
      success: true,
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des commissions." },
      { status: error.statusCode || 500 }
    );
  }
}

