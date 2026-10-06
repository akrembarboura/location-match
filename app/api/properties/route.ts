export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { PropertySearchSchema } from "@/server/validations/property";
import { propertyService } from "@/server/services/PropertyService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rlKey = generateRateLimitKey(POLICIES.SEARCH.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.SEARCH);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const searchParams = request.nextUrl.searchParams;
    const rawFilters = Object.fromEntries(searchParams.entries());
    
    // Zod validation
    const parsed = PropertySearchSchema.safeParse(rawFilters);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation Error", details: parsed.error.format() }, { status: 400 });
    }

    const properties = await propertyService.searchProperties(parsed.data);
    return NextResponse.json(properties);
  } catch (error: any) {
    console.error("GET /api/properties error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
