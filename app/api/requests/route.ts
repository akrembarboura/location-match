export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { CreateRentalRequestSchema } from "@/lib/rentals/request-schema";
import { requestService } from "@/server/services/RequestService";
import { authService } from "@/server/services/AuthService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.MUTATION.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.MUTATION);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const body = await req.json();
    const parsed = CreateRentalRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Erreur de validation",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Check if the submitter is logged in to link their account
    const currentUser = await authService.getCurrentUser().catch(() => null);
    const customerId = currentUser?.id;

    const created = await requestService.createRequest(parsed.data, customerId);

    return NextResponse.json(
      {
        success: true,
        message: "Demande de location enregistrée avec succès.",
        id: created.id,
        request: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/requests error:", error);
    return NextResponse.json(
      { error: error.message || "Une erreur est survenue lors de l'enregistrement de votre demande." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await authService.getCurrentUser().catch(() => null);
    if (!currentUser) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const requests = await requestService.getCustomerRequests(currentUser.id);
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de vos demandes." },
      { status: 500 }
    );
  }
}

