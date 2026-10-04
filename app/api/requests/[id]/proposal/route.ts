import { NextRequest, NextResponse } from "next/server";
import { requestService } from "@/server/services/RequestService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { z } from "zod";

const RespondSchema = z.object({
  propertyId: z.string().min(1),
  action: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.MUTATION.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.MUTATION);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = RespondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const updated = await requestService.respondToProposal(
      id,
      parsed.data.propertyId,
      parsed.data.action
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Demande ou proposition introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        parsed.data.action === "ACCEPTED"
          ? "Proposition acceptée ! Notre équipe va finaliser votre réservation."
          : "Proposition refusée. Notre équipe va vous proposer d'autres options.",
    });
  } catch (error: any) {
    console.error("POST /api/requests/[id]/proposal error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement de votre réponse." },
      { status: 500 }
    );
  }
}
