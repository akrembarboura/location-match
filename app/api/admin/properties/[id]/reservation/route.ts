import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { propertyService } from "@/server/services/PropertyService";
import { PropertyReservationSchema } from "@/server/validations/property";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.ADMIN_API.name, ip, admin.id);
    const rlResult = await rateLimit(rlKey, POLICIES.ADMIN_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { id } = await params;
    const body = await req.json();

    const parsed = PropertyReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dates de réservation invalides.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updated = await propertyService.reserveProperty(
      id,
      { from: parsed.data.from, to: parsed.data.to },
      admin.id
    );

    return NextResponse.json({
      success: true,
      message: "Bien marqué comme réservé.",
      property: updated,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    if (error.message?.includes("introuvable")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors de la réservation du bien." },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.ADMIN_API.name, ip, admin.id);
    const rlResult = await rateLimit(rlKey, POLICIES.ADMIN_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { id } = await params;
    const body = await req.json();

    const parsed = PropertyReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dates de réservation invalides.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updated = await propertyService.updateReservation(
      id,
      { from: parsed.data.from, to: parsed.data.to },
      admin.id
    );

    return NextResponse.json({
      success: true,
      message: "Dates de réservation mises à jour.",
      property: updated,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    if (error.message?.includes("introuvable")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour de la réservation." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.ADMIN_API.name, ip, admin.id);
    const rlResult = await rateLimit(rlKey, POLICIES.ADMIN_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const { id } = await params;

    const updated = await propertyService.releaseReservation(id, admin.id);

    return NextResponse.json({
      success: true,
      message: "Réservation libérée. Le bien est à nouveau disponible.",
      property: updated,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    if (error.message?.includes("introuvable")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors de la libération de la réservation." },
      { status: 400 }
    );
  }
}
