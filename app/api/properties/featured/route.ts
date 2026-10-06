export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/server/services/PropertyService";
import { POLICIES } from "@/server/rate-limit/policies";
import { publicRateLimit } from "@/server/rate-limit/public";

export async function GET(req: NextRequest) {
  const limited = await publicRateLimit(req, POLICIES.PUBLIC_API);
  if (limited) return limited;

  try {
    const featuredProperties = await propertyService.getFeaturedProperties();
    return NextResponse.json(featuredProperties);
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error("GET /api/properties/featured failed:", errorName);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
