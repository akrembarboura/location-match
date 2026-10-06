import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/utils/auth";
import { reservationRepository } from "@/server/repositories/ReservationRepository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const reservations = await reservationRepository.findByCustomerId(session.sub);
    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error("GET /api/customer/reservations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
