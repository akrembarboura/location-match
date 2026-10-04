import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { propertyService } from "@/server/services/PropertyService";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;

    const updated = await propertyService.reviewProperty(id, admin.id);
    return NextResponse.json({
      success: true,
      message: "Bien pris en charge pour vérification.",
      property: updated,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("POST /api/admin/properties/[id]/review error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la prise en charge." },
      { status: 400 }
    );
  }
}

