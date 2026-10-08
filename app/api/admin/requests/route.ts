export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requestService } from "@/server/services/RequestService";
import { requireRole } from "@/server/utils/auth-guards";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const rentalCategory = searchParams.get("rentalCategory") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));

    const result = await requestService.getAdminRequests({ status, rentalCategory, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/requests error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
