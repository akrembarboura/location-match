import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { propertyService } from "@/server/services/PropertyService";
import { RejectPropertySchema } from "@/server/validations/property";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json();

    const parsed = RejectPropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation échouée", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await propertyService.rejectProperty(
      id,
      admin.id,
      parsed.data.rejectionReason
    );

    return NextResponse.json({
      success: true,
      message: "Bien refusé avec motif transmis au propriétaire.",
      property: updated,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("POST /api/admin/properties/[id]/reject error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du refus du bien." },
      { status: 400 }
    );
  }
}

