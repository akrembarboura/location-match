import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { ownerDashboardService } from "@/server/services/OwnerDashboardService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireOwnerAccess();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || undefined;
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    const calendarData = await ownerDashboardService.getCalendarData(user.id, propertyId, month, year);
    return NextResponse.json(calendarData);
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    console.error("GET /api/owner/calendar error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement du calendrier" }, { status: 500 });
  }
}
