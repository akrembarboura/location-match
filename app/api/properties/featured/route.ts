import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/server/services/PropertyService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // 1. Extract Client IP
    const ip = getClientIp(req);
    
    // 2. Apply Rate Limiting
    const rlKey = generateRateLimitKey(POLICIES.PUBLIC_API.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.PUBLIC_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    // 3. Fetch Featured Properties from Service Layer
    // Ensure 'getFeatured' or your equivalent method exists in PropertyService
    const featuredProperties = await propertyService.getFeaturedProperties();    
    // 4. Return successful JSON payload
    return NextResponse.json(featuredProperties);
    
  } catch (error: any) {
    // Crucial: This logs the exact runtime issue to your terminal console
    console.error("GET /api/properties/featured error:", error);
    
    // Returns 500 error payload with optional details for quick debugging
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        message: error?.message || "An unexpected error occurred"
      }, 
      { status: 500 }
    );
  }
}
