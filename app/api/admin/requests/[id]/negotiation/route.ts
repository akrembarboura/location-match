export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requestService } from "@/server/services/RequestService";
import { requireRole } from "@/server/utils/auth-guards";
import { z } from "zod";

const CustomerVerificationSchema = z.object({
  action: z.literal("CUSTOMER_VERIFICATION"),
  status: z.enum(["PENDING", "CONTACTED", "CONFIRMED", "DECLINED"]),
  notes: z.string().optional(),
});

const OwnerNegotiationSchema = z.object({
  action: z.literal("OWNER_NEGOTIATION"),
  status: z.enum(["PENDING", "CONTACTED", "AGREED", "REJECTED"]),
  proposedRate: z.number().min(0).max(50).optional(),
  proposedBasis: z.enum(["FIRST_MONTH_RENT", "FIRST_AGREED_PAYMENT", "TOTAL_RENTAL_VALUE"]).optional(),
  collectionFlow: z.enum(["OWNER_DIRECT", "PLATFORM_COLLECTS", "MIXED"]).optional(),
  notes: z.string().optional(),
});

const ConfirmTermsSchema = z.object({
  action: z.literal("CONFIRM_TERMS"),
  rate: z.number().min(0).max(50),
  basis: z.enum(["FIRST_MONTH_RENT", "FIRST_AGREED_PAYMENT", "TOTAL_RENTAL_VALUE"]),
  rentalBasis: z.number().min(0).optional(),
  collectionFlow: z.enum(["OWNER_DIRECT", "PLATFORM_COLLECTS", "MIXED"]).optional(),
  waivedReason: z.string().optional(),
});

const RecordPaymentSchema = z.object({
  action: z.literal("RECORD_PAYMENT"),
  amount: z.number().positive(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
});

const VerifyPaymentSchema = z.object({
  action: z.literal("VERIFY_PAYMENT"),
  verifiedAmount: z.number().positive().optional(),
  transactionId: z.string().optional(),
});

const RequestBodySchema = z.discriminatedUnion("action", [
  CustomerVerificationSchema,
  OwnerNegotiationSchema,
  ConfirmTermsSchema,
  RecordPaymentSchema,
  VerifyPaymentSchema,
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json();

    const parsed = RequestBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation des paramètres de négociation échouée", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    let result: any = null;

    switch (payload.action) {
      case "CUSTOMER_VERIFICATION":
        result = await requestService.recordCustomerVerification(id, payload, adminUser.id);
        break;
      case "OWNER_NEGOTIATION":
        result = await requestService.recordOwnerNegotiation(id, payload, adminUser.id);
        break;
      case "CONFIRM_TERMS":
        result = await requestService.confirmCommissionTerms(id, payload, adminUser.id);
        break;
      case "RECORD_PAYMENT":
        result = await requestService.recordCommissionPayment(id, payload, {
          userId: adminUser.id,
          role: adminUser.role,
        });
        break;
      case "VERIFY_PAYMENT":
        result = await requestService.verifyCommissionPayment(id, payload, adminUser.id);
        break;
    }

    if (!result) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: result });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: error.statusCode || 500 });
  }
}
