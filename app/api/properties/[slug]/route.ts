import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/server/services/PropertyService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rlKey = generateRateLimitKey(POLICIES.PUBLIC_API.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.PUBLIC_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { slug } = await params;
    const property = await propertyService.getPropertyBySlug(slug);
    
    if (!property) {
      return NextResponse.json({ error: "Property Not Found" }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
