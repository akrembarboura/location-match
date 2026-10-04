import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { analyticsService } from "@/server/analytics/AnalyticsService";
import { AnalyticsPeriodSchema } from "@/lib/analytics/validations";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.ADMIN_API.name, ip, admin.id);
    const rlResult = await rateLimit(rlKey, POLICIES.ADMIN_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get("period") || "30d";
    const period = AnalyticsPeriodSchema.parse(periodParam);

    const overview = await analyticsService.getAdminOverview(period);
    return NextResponse.json(overview);
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Erreur serveur lors du calcul des statistiques." }, { status: 500 });
  }
}
