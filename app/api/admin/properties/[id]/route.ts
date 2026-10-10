import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { propertyService } from "@/server/services/PropertyService";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;

    const result = await propertyService.getAdminProperty(id);
    if (!result) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/properties/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;

    let reason: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.reason === "string") {
        reason = body.reason.trim();
      }
    } catch {
      // Body is optional
    }

    const result = await propertyService.deleteProperty({
      id,
      userId: admin.id,
      userRole: admin.role,
      reason,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("DELETE /api/admin/properties/[id] error:", error);
    const status = error.status || (error.message?.includes("introuvable") ? 404 : 400);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du bien." },
      { status }
    );
  }
}

