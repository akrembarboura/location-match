import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { ReservationModel, HousingRequestModel, AuditLogModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import crypto from "node:crypto";

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
    const body = await req.json().catch(() => ({}));
    const reasonText = body?.reason?.trim() || "Verrouillage de sécurité effectué par l'administration";

    await connectToDatabase();

    let reservation = await ReservationModel.findOne({
      $or: [
        { id },
        { requestId: id },
        { propertyId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    }).exec();

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 }
      );
    }

    const revokedAt = new Date();

    reservation.contactAccessOverride = {
      enabled: false,
      grantedBy: admin.id || admin.email || "ADMIN",
      grantedAt: revokedAt,
      reason: reasonText,
    };

    await reservation.save();

    // Sync to HousingRequestModel
    await HousingRequestModel.updateOne(
      { $or: [{ id: id }, { id: reservation.requestId }, { requestId: reservation.requestId }] },
      { $set: { contactAccessOverride: reservation.contactAccessOverride } }
    ).exec();

    // Audit Log Creation
    await AuditLogModel.create({
      id: `audit-${crypto.randomBytes(8).toString("hex")}`,
      action: "CONTACT_ACCESS_OVERRIDE_REVOKED",
      actorId: admin.id || "ADMIN",
      actorRole: admin.role || "ADMIN",
      targetType: "RESERVATION",
      targetId: reservation.id,
      reason: reasonText,
      details: {
        propertyId: reservation.propertyId,
        ownerId: reservation.ownerId,
        customerId: reservation.customerId,
        revokedAt,
      },
      occurredAt: revokedAt,
    });

    return NextResponse.json({
      success: true,
      message: "Les coordonnées du client ont été verrouillées à nouveau pour le propriétaire.",
      reservation: {
        id: reservation.id,
        status: reservation.status,
        paymentSummary: reservation.paymentSummary,
        contactAccessOverride: reservation.contactAccessOverride,
      },
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors du verrouillage des coordonnées." },
      { status: 500 }
    );
  }
}
