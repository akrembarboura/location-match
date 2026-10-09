import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { financeLedgerService } from "@/server/services/FinanceLedgerService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);
    const fromDateStr = searchParams.get("fromDate");
    const toDateStr = searchParams.get("toDate");
    const ownerId = searchParams.get("ownerId") || undefined;

    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;

    const overview = await financeLedgerService.getFinancialOverview({
      fromDate,
      toDate,
      ownerId,
    });

    return NextResponse.json({ success: true, overview });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération de la vue d'ensemble financière." },
      { status: error.statusCode || 500 }
    );
  }
}

