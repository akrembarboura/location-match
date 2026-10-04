import { NextRequest, NextResponse } from "next/server";
import { analyticsRepository } from "@/server/analytics/AnalyticsRepository";
import { TrackEventInputSchema } from "@/lib/analytics/validations";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { getSession } from "@/server/utils/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.PUBLIC_API.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.PUBLIC_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    // 2. Parse & validate payload
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const parsed = TrackEventInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation échouée", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const eventData = parsed.data;

    // 3. Optional session attachment (detect actorType if logged in)
    try {
      const session = await getSession();
      if (session) {
        if (!eventData.actorType) {
          eventData.actorType =
            session.role === "ADMIN" || session.role === "SUPER_ADMIN"
              ? "ADMIN"
              : session.role === "OWNER"
              ? "OWNER"
              : "CUSTOMER";
        }
      }
    } catch {
      // Continue even if session lookup fails
    }

    // 4. Save event in background / repository
    await analyticsRepository.recordEvent(eventData);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/analytics/events error:", error);
    // Analytics failures must never break the client; return graceful response
    return NextResponse.json({ success: false, error: "Erreur enregistrement analytique" }, { status: 500 });
  }
}
