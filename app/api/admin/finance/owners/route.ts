import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { UserModel, ReservationModel, CommissionSnapshotModel, FinancialLedgerModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const owners = await UserModel.find({ role: "OWNER" }).select("id firstName lastName phone email status").lean().exec();
    const ownerIds = owners.map((o: any) => o.id);

    const [snapshots, ledgerTx] = await Promise.all([
      CommissionSnapshotModel.find().lean().exec(),
      FinancialLedgerModel.find().lean().exec(),
    ]);

    const resOwnerMap = new Map<string, string>();
    const reservations = await ReservationModel.find({ id: { $in: snapshots.map((s: any) => s.reservationId) } }).select("id ownerId").lean().exec();
    for (const r of reservations) {
      resOwnerMap.set(r.id, r.ownerId);
    }

    const items = owners.map((owner: any) => {
      const ownerSnapshots = snapshots.filter((s: any) => resOwnerMap.get(s.reservationId) === owner.id || s.ownerId === owner.id);
      const ownerTx = ledgerTx.filter((t: any) => t.ownerId === owner.id);

      let commissionEarned = 0;
      let verifiedRemittances = 0;
      let reportedRemittances = 0;
      let platformHeldRent = 0;

      for (const s of ownerSnapshots) {
        commissionEarned += s.calculatedCommission;
      }

      for (const tx of ownerTx) {
        if (tx.type === "COMMISSION_REMITTANCE") {
          if (tx.status === "VERIFIED") verifiedRemittances += tx.amount;
          else if (tx.status === "REPORTED") reportedRemittances += tx.amount;
        }
        if (tx.type === "RENTAL_COLLECTION" && tx.status === "VERIFIED" && tx.collectionFlow === "PLATFORM_COLLECTS") {
          platformHeldRent += tx.amount;
        }
      }

      const commissionReceivable = Math.max(0, commissionEarned - verifiedRemittances);
      const ownerPayable = Math.max(0, platformHeldRent - commissionEarned);

      return {
        ownerId: owner.id,
        name: `${owner.firstName || ""} ${owner.lastName || ""}`.trim() || "Propriétaire",
        email: owner.email,
        phone: owner.phone,
        status: owner.status,
        reservationCount: ownerSnapshots.length,
        commissionEarned: Math.round(commissionEarned * 1000) / 1000,
        commissionReceivable: Math.round(commissionReceivable * 1000) / 1000,
        reportedRemittances: Math.round(reportedRemittances * 1000) / 1000,
        verifiedRemittances: Math.round(verifiedRemittances * 1000) / 1000,
        platformHeldRent: Math.round(platformHeldRent * 1000) / 1000,
        ownerPayable: Math.round(ownerPayable * 1000) / 1000,
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des balances propriétaires." },
      { status: error.statusCode || 500 }
    );
  }
}

