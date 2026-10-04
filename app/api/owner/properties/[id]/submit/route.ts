import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { propertyService } from "@/server/services/PropertyService";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerAccess();
    const { id } = await params;

    const submitted = await propertyService.submitOwnerProperty(id, user.id);
    return NextResponse.json({
      success: true,
      message: "Votre bien a été soumis avec succès pour vérification.",
      property: submitted,
    });
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    return NextResponse.json(
      { error: error.message || "Erreur lors de la soumission du bien." },
      { status: 400 }
    );
  }
}
