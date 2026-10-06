import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { ReservationModel, AuditLogModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import crypto from "node:crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UnlockReasonSchema = z.object({
  reason: z
    .string({ required_error: "Le motif du déverrouillage est obligatoire." })
    .trim()
    .min(3, "Le motif doit contenir au moins 3 caractères.")
    .max(500, "Le motif ne peut pas dépasser 500 caractères."),
});

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

    const parsed = UnlockReasonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Motif de déverrouillage invalide ou manquant.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

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
      const { HousingRequestModel, PropertyModel } = await import("@/lib/models");
      const { calculateNights } = await import("@/lib/date-utils");

      const housingReq = await HousingRequestModel.findOne({
        $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      }).lean().exec();

      if (housingReq) {
        const propId = housingReq.propertyId || housingReq.selectedProperty;
        if (propId) {
          const prop = await PropertyModel.findOne({ id: propId }).lean().exec();
          if (prop) {
            const checkInDate = housingReq.checkIn ? new Date(housingReq.checkIn) : new Date();
            const checkOutDate = housingReq.checkOut ? new Date(housingReq.checkOut) : new Date(Date.now() + 3 * 86400000);
            const nights = calculateNights(checkInDate, checkOutDate);
            const nightlyRate = prop.pricePerNight || prop.pricing?.price || 150;
            const total = nightlyRate * nights;

            const resId = `LM-${new Date().getFullYear()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

            reservation = await ReservationModel.create({
              id: resId,
              requestId: housingReq.id,
              propertyId: propId,
              ownerId: prop.ownerId,
              customerId: housingReq.customerId || undefined,
              customerName: housingReq.customer?.fullName || housingReq.customer?.name || "Client LOC MAISON",
              customerPhone: housingReq.customer?.phone || housingReq.phone || "",
              checkIn: checkInDate,
              checkOut: checkOutDate,
              guests: housingReq.guests || housingReq.people || 1,
              status: "CONFIRMED",
              pricing: {
                pricePerNight: nightlyRate,
                totalNights: nights,
                subtotal: total,
                total,
                currency: "TND",
              },
              paymentSummary: {
                paidAmount: 0,
                remainingAmount: total,
                status: "UNPAID",
              },
            });
          }
        }
      }
    }

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable pour cet identifiant." },
        { status: 404 }
      );
    }

    const grantedAt = new Date();
    const reasonText = parsed.data.reason;

    reservation.contactAccessOverride = {
      enabled: true,
      grantedBy: admin.id || admin.email || "ADMIN",
      grantedAt,
      reason: reasonText,
    };

    await reservation.save();

    const { HousingRequestModel } = await import("@/lib/models");
    await HousingRequestModel.updateOne(
      { $or: [{ id: id }, { id: reservation.requestId }, { requestId: reservation.requestId }] },
      { $set: { contactAccessOverride: reservation.contactAccessOverride } }
    ).exec();

    // Audit Log Creation
    await AuditLogModel.create({
      id: `audit-${crypto.randomBytes(8).toString("hex")}`,
      action: "CONTACT_ACCESS_OVERRIDE_GRANTED",
      actorId: admin.id || "ADMIN",
      actorRole: admin.role || "ADMIN",
      targetType: "RESERVATION",
      targetId: reservation.id,
      reason: reasonText,
      details: {
        propertyId: reservation.propertyId,
        ownerId: reservation.ownerId,
        customerId: reservation.customerId,
        grantedAt,
      },
      occurredAt: grantedAt,
    });

    return NextResponse.json({
      success: true,
      message: "Coordonnées client déverrouillées avec succès pour le propriétaire.",
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
      { error: error.message || "Erreur lors du déverrouillage des coordonnées." },
      { status: 500 }
    );
  }
}
