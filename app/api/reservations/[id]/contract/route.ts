import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { ContractService } from "@/server/services/ContractService";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const reservationId = resolvedParams.id;

    if (!reservationId) {
      return NextResponse.json({ error: "Identifiant de réservation manquant" }, { status: 400 });
    }

    const contractData = await ContractService.getContractData(reservationId, user);
    return NextResponse.json({ success: true, contract: contractData });
  } catch (error: any) {
    const authRes = ownerAuthErrorResponse(error);
    if (authRes) return authRes;

    if (error.message === "RESERVATION_NOT_FOUND") {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    if (error.message === "PROPERTY_NOT_FOUND") {
      return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès refusé à ce contrat" }, { status: 403 });
    }

    console.error("GET /api/reservations/[id]/contract error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération du contrat" }, { status: 500 });
  }
}
