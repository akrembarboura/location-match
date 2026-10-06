export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/server/services/PropertyService";
import { POLICIES } from "@/server/rate-limit/policies";
import { publicRateLimit } from "@/server/rate-limit/public";

export async function GET(req: NextRequest) {
  const limited = await publicRateLimit(req, POLICIES.PUBLIC_API);
  if (limited) return limited;

  try {
    const categories = await propertyService.getCategories();
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
