import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { financeLedgerService } from "@/server/services/FinanceLedgerService";
import { paymentRepository } from "@/server/repositories/PaymentRepository";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;

    const tx = await financeLedgerService.verifyTransaction(admin.id, id);

    // Also sync payment status in PaymentModel if linked
    try {
      await paymentRepository.verifyPayment(admin.id, id);
    } catch {
      /* payment doc might not exist directly if recorded strictly via ledger */
    }

    return NextResponse.json({
      success: true,
      message: "Transaction vérifiée et comptabilisée en trésorerie.",
      transaction: tx,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Impossible de vérifier la transaction." },
      { status: error.statusCode || 500 }
    );
  }
}

