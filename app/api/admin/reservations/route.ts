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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && status !== "ALL") {
      query.status = status;
    }
    if (propertyId) {
      query.propertyId = propertyId;
    }

    const [reservations, total] = await Promise.all([
      ReservationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ReservationModel.countDocuments(query),
    ]);

    // Attach property metadata
    const propIds = Array.from(new Set(reservations.map((r: any) => r.propertyId)));
    const properties = propIds.length > 0
      ? await PropertyModel.find({ id: { $in: propIds } })
          .select("id title city location images")
          .lean()
          .exec()
      : [];
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    const items = reservations.map((r: any) => {
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

    return NextResponse.json({
      reservations: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
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
