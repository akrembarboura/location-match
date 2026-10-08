import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { propertyService } from "@/server/services/PropertyService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));

    const data = await propertyService.getAdminProperties({ status, page, limit });
    return NextResponse.json(data);
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

