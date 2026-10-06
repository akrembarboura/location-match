import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { ReservationModel, PropertyModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.ADMIN_API.name, ip, admin.id);
    const rlResult = await rateLimit(rlKey, POLICIES.ADMIN_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("propertyId");

    const query: any = {};
    if (status && status !== "ALL") {
      query.status = status;
    }
    if (propertyId) {
      query.propertyId = propertyId;
    }

    const reservations = await ReservationModel.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Attach property metadata
    const propIds = Array.from(new Set(reservations.map((r: any) => r.propertyId)));
    const properties = await PropertyModel.find({ id: { $in: propIds } })
      .select("id title city location images")
      .lean()
      .exec();
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    const result = reservations.map((r: any) => {
      const prop = propMap.get(r.propertyId);
      return {
        ...r,
        propertyTitle: prop?.title || "Logement",
        propertyCity: prop?.city || prop?.location?.city || "Mahdia",
        propertyCoverImage:
          prop?.images?.[0]?.url ||
          (typeof prop?.images?.[0] === "string" ? prop.images[0] : null) ||
          "/placeholder-property.jpg",
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors du chargement des réservations." },
      { status: 500 }
    );
  }
}
