export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { PropertySearchSchema } from "@/server/validations/property";
import { propertyService } from "@/server/services/PropertyService";
import { POLICIES } from "@/server/rate-limit/policies";
import { publicRateLimit } from "@/server/rate-limit/public";

export async function GET(request: NextRequest) {
  const limited = await publicRateLimit(request, POLICIES.SEARCH);
  if (limited) return limited;

  const rawFilters = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = PropertySearchSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const { properties, hasMore } = await propertyService.searchPropertiesPage(parsed.data);
    return NextResponse.json(properties, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Page": String(parsed.data.page ?? 1),
        "X-Page-Size": String(parsed.data.limit ?? 50),
        "X-Has-More": String(hasMore),
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/properties error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
