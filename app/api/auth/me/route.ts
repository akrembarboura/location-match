import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/AuthService";
import { generateUserRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const rlKey = generateUserRateLimitKey(POLICIES.AUTHENTICATED_API.name, user.id);
    const rlResult = await rateLimit(rlKey, POLICIES.AUTHENTICATED_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
