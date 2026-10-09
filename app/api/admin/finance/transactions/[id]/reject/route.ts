import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { financeLedgerService } from "@/server/services/FinanceLedgerService";
import { paymentRepository } from "@/server/repositories/PaymentRepository";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Paiement non valide ou non reçu.";

    const tx = await financeLedgerService.rejectTransaction(admin.id, id, reason);

    try {
      await paymentRepository.rejectPayment(admin.id, id, reason);
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      success: true,
      message: "Transaction rejetée.",
      transaction: tx,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Impossible de rejeter la transaction." },
      { status: error.statusCode || 500 }
    );
  }
}

