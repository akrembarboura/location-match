import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { propertyService } from "@/server/services/PropertyService";
import { UpdateOwnerPropertySchema } from "@/server/validations/property";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerAccess();
    const { id } = await params;

    const property = await propertyService.getOwnerProperty(id, user.id);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: error.message === "Accès refusé." ? 403 : 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerAccess();
    const { id } = await params;
    const body = await req.json();

    const parsed = UpdateOwnerPropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation échouée", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Ownership is verified in the service against the session user id.
    const updated = await propertyService.updateOwnerProperty(id, parsed.data, user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour du bien." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerAccess();
    const { id } = await params;

    const result = await propertyService.deleteProperty({
      id,
      userId: user.id,
      userRole: "OWNER",
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    const status =
      error.status ||
      (error.message?.includes("Accès refusé")
        ? 403
        : error.message?.includes("introuvable")
        ? 404
        : 400);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du bien." },
      { status }
    );
  }
}
