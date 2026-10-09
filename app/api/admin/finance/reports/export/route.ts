import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { FinancialLedgerModel, CommissionSnapshotModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@]/.test(str)) {
    str = `'` + str;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "commissions"; // "commissions" or "ledger"

    if (type === "commissions") {
      const snapshots = await CommissionSnapshotModel.find().sort({ confirmedAt: -1 }).lean().exec();
      const headers = [
        "ID Snapshot",
        "ID Reservation",
        "Scope",
        "Taux (%)",
        "Mode Calcul",
        "Base Locative (TND)",
        "Commission Calculee (TND)",
        "Canal Encaissement",
        "Date Confirmation",
      ];

      const rows = snapshots.map((s: any) => [
        sanitizeCsvValue(s.id),
        sanitizeCsvValue(s.reservationId),
        sanitizeCsvValue(s.scope),
        sanitizeCsvValue(s.rate),
        sanitizeCsvValue(s.calculationMethod),
        sanitizeCsvValue(s.rentalBasis),
        sanitizeCsvValue(s.calculatedCommission),
        sanitizeCsvValue(s.collectionFlow),
        sanitizeCsvValue(s.confirmedAt ? new Date(s.confirmedAt).toISOString() : ""),
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="commissions-export-${Date.now()}.csv"`,
        },
      });
    } else {
      const txs = await FinancialLedgerModel.find().sort({ createdAt: -1 }).lean().exec();
      const headers = [
        "ID Transaction",
        "ID Reservation",
        "Proprietaire",
        "Type",
        "Sens",
        "Montant (TND)",
        "Canal Encaissement",
        "Statut",
        "Reference",
        "Date Reglement",
      ];

      const rows = txs.map((t: any) => [
        sanitizeCsvValue(t.id),
        sanitizeCsvValue(t.reservationId),
        sanitizeCsvValue(t.ownerId),
        sanitizeCsvValue(t.type),
        sanitizeCsvValue(t.direction),
        sanitizeCsvValue(t.amount),
        sanitizeCsvValue(t.collectionFlow),
        sanitizeCsvValue(t.status),
        sanitizeCsvValue(t.reference),
        sanitizeCsvValue(t.createdAt ? new Date(t.createdAt).toISOString() : ""),
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ledger-transactions-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'export du rapport." },
      { status: error.statusCode || 500 }
    );
  }
}

