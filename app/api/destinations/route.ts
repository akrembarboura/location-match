import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/server/services/PropertyService";
import { POLICIES } from "@/server/rate-limit/policies";
import { publicRateLimit } from "@/server/rate-limit/public";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = await publicRateLimit(req, POLICIES.PUBLIC_API);
  if (limited) return limited;

  try {
    const destinations = await propertyService.getDestinations();
    return NextResponse.json(destinations, {
      headers: {
        // CDN caches for 5 min and serves stale for 1 h while revalidating
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("GET /api/destinations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}