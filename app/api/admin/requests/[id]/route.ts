export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requestService } from "@/server/services/RequestService";
import { requireRole } from "@/server/utils/auth-guards";
import { REQUEST_STATUSES } from "@/lib/rentals/request-schema";
import { z } from "zod";

const PatchSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  adminNotes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const requestData = await requestService.getAdminRequest(id);

    if (!requestData) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    return NextResponse.json(requestData);
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation échouée", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await requestService.updateRequestStatus(
      id,
      parsed.data.status || "PENDING",
      parsed.data.adminNotes,
      adminUser.id
    );

    if (!updated) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.name === "AuthenticationError") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (error.name === "AuthorizationError") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
