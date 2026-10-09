import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { CommissionSnapshotModel, ReservationModel, PropertyModel, UserModel, FinancialLedgerModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();
    const { id } = await params;

    const snapshot = await CommissionSnapshotModel.findOne({
      $or: [{ id }, { reservationId: id }],
    }).lean().exec();

    if (!snapshot) {
      return NextResponse.json({ success: false, error: "Snapshot de commission introuvable." }, { status: 404 });
    }

    const reservation = await ReservationModel.findOne({ id: snapshot.reservationId }).lean().exec();
    const property = reservation ? await PropertyModel.findOne({ id: reservation.propertyId }).lean().exec() : null;
    const owner = reservation ? await UserModel.findOne({ id: reservation.ownerId }).select("id firstName lastName phone email").lean().exec() : null;

    const ledgerTransactions = await FinancialLedgerModel.find({
      reservationId: snapshot.reservationId,
    }).sort({ createdAt: -1 }).lean().exec();

    return NextResponse.json({
      success: true,
      snapshot,
      reservation,
      property,
      owner,
      ledgerTransactions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des détails de la commission." },
      { status: error.statusCode || 500 }
    );
  }
}

