import { NextRequest, NextResponse } from "next/server";
import { requestService } from "@/server/services/RequestService";
import { requireRole } from "@/server/utils/auth-guards";
import { z } from "zod";

const AddProposalSchema = z.object({
  propertyId: z.string().min(1, "L'identifiant du bien est requis."),
  proposedPrice: z.coerce.number().positive().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adminMessage: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json();
    const parsed = AddProposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation échouée", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await requestService.addProposal(id, parsed.data);

    if (!updated) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Proposition ajoutée avec succès et transmise au client.",
      request: updated,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (error.name === "AuthorizationError") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
