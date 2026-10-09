import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { financeLedgerService } from "@/server/services/FinanceLedgerService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    if (!body.reason) {
      return NextResponse.json({ success: false, error: "Le motif de l'annulation est obligatoire." }, { status: 400 });
    }

    const reversalTx = await financeLedgerService.reverseTransaction(admin.id, id, body.reason);

    return NextResponse.json({
      success: true,
      message: "Transaction annulée avec succès et écriture d'extourne générée.",
      reversalTransaction: reversalTx,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Impossible d'annuler la transaction." },
      { status: error.statusCode || 500 }
    );
  }
}

