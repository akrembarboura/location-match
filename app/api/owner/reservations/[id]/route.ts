import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { reservationRepository } from "@/server/repositories/ReservationRepository";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerAccess();
    const { id } = await params;

    const reservation = await reservationRepository.findById(id, user.id);
    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    console.error("GET /api/owner/reservations/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
