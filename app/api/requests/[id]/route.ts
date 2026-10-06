export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requestService } from "@/server/services/RequestService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.PUBLIC_API.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.PUBLIC_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { id } = await params;
    const requestData = await requestService.getClientRequest(id);

    if (!requestData) {
      return NextResponse.json(
        { error: "Demande introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(requestData);
  } catch (error: any) {
    console.error("GET /api/requests/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de la demande." },
      { status: 500 }
    );
  }
}
