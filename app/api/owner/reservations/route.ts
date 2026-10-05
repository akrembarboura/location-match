import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { reservationRepository } from "@/server/repositories/ReservationRepository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireOwnerAccess();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || undefined;
    const status = searchParams.get("status") || undefined;

    const reservations = await reservationRepository.findByOwnerId(user.id, { propertyId, status });
    return NextResponse.json(reservations);
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    console.error("GET /api/owner/reservations error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
