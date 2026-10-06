import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/utils/auth";
import { reservationRepository } from "@/server/repositories/ReservationRepository";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await reservationRepository.findCustomerReservationById(id, session.sub);

    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error("GET /api/customer/reservations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
