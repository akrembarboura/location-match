import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import connectToDatabase from "@/lib/mongoose";
import { PropertyModel, OwnerModel } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const [rawProperties, rawOwners] = await Promise.all([
      PropertyModel.find({}).sort({ createdAt: -1 }).lean().exec(),
      OwnerModel.find({}).lean().exec(),
    ]);

    const ownersMap = new Map(rawOwners.map((o: any) => [o.id, o]));

    const properties = rawProperties.map((p: any) => {
      const owner = ownersMap.get(p.ownerId);
      return {
        id: p.id,
        title: p.title || `${p.type || "Bien"} — ${p.area || ""}`,
        type: p.type || "Logement",
        area: p.area || "—",
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        surface: p.surface,
        summerPrice: p.summerPrice,
        studentPrice: p.studentPrice,
        verified: Boolean(p.verified),
        status: p.status || "DISPONIBLE",
        images: p.images || [],
        description: p.description,
        owner: owner
          ? {
              id: owner.id,
              name: owner.name,
              phone: owner.phone,
            }
          : null,
      };
    });

    return NextResponse.json({
      properties,
      totalCount: properties.length,
      ownersCount: rawOwners.length,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/properties error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
