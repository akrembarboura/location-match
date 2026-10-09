import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { paymentRepository } from "@/server/repositories/PaymentRepository";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerAccess();
    const { id: reservationId } = await params;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed
    }

    const targetStatus = body?.status === "UNPAID" ? "UNPAID" : "REPORTED";

    const result = await paymentRepository.updatePaymentStatusByOwner(
      user.id,
      reservationId,
      targetStatus,
      body?.amount ? Number(body.amount) : undefined,
      body?.paidMonths
    );

    return NextResponse.json(result);
  } catch (error: any) {
    const authRes = ownerAuthErrorResponse(error);
    if (authRes) return authRes;

    console.error("POST /api/owner/reservations/[id]/report-cash error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la déclaration du paiement." },
      { status: 400 }
    );
  }
}

