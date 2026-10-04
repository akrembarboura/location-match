import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/server/services/PropertyService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.PUBLIC_API.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.PUBLIC_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const categories = await propertyService.getCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
