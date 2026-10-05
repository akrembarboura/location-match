import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { ownerDashboardService } from "@/server/services/OwnerDashboardService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireOwnerAccess();
    const overview = await ownerDashboardService.getDashboardOverview(user.id);
    return NextResponse.json(overview);
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    console.error("GET /api/owner/overview error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 });
  }
}
