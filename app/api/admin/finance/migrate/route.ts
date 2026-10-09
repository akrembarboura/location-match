import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { runFinanceBackfillMigration } from "@/server/migrations/finance-backfill";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;

    const report = await runFinanceBackfillMigration({ dryRun });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'exécution de la migration." },
      { status: error.statusCode || 500 }
    );
  }
}

