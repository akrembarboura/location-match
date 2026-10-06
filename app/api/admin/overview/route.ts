export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import connectToDatabase from "@/lib/mongoose";
import { HousingRequestModel, PropertyModel, DealModel } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const [
      openRequestsCount,
      totalPropertiesCount,
      unverifiedPropertiesCount,
      dealsCount,
      deals,
    ] = await Promise.all([
      HousingRequestModel.countDocuments({
        status: { $nin: ["COMPLETED", "REJECTED", "CANCELLED"] },
      }),
      PropertyModel.countDocuments({}),
      PropertyModel.countDocuments({ verified: false }),
      DealModel.countDocuments({}),
      DealModel.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // Calculate total margin from real deals
    const totalMargin = deals.reduce((acc, d: any) => {
      const margin = (d.customerOffer || 0) - (d.ownerPrice || 0);
      return acc + (margin > 0 ? margin : 0);
    }, 0);

    return NextResponse.json({
      stats: {
        openRequests: openRequestsCount,
        properties: totalPropertiesCount,
        unverifiedProperties: unverifiedPropertiesCount,
        dealsCount: dealsCount,
        totalMargin: totalMargin,
      },
      recentDeals: deals.map((d: any) => ({
        id: d.id,
        property: d.property,
        ownerPrice: d.ownerPrice,
        customerOffer: d.customerOffer,
        margin: (d.customerOffer || 0) - (d.ownerPrice || 0),
        closed: d.closed || (d.createdAt ? new Date(d.createdAt).toLocaleDateString("fr-FR") : "—"),
      })),
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/overview error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
