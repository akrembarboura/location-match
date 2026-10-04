import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { analyticsService } from "@/server/analytics/AnalyticsService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);

    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.AUTHENTICATED_API.name, ip, user.id);
    const rlResult = await rateLimit(rlKey, POLICIES.AUTHENTICATED_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { id } = await params;
    const analytics = await analyticsService.getOwnerPropertyPerformance(id, user);

    return NextResponse.json(analytics);
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: error.message || "Accès refusé." }, { status: 403 });
    }
    if (error.message?.includes("introuvable")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("GET /api/owner/properties/[id]/analytics error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
