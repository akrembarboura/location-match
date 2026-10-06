import connectToDatabase from "@/lib/mongoose";
import { UserModel, PropertyModel, ReservationModel, AuditLogModel, PaymentModel } from "@/lib/models";
import { ContactReleasePolicy } from "@/server/services/ContactReleasePolicy";
import { formatCustomerContactForOwner, reservationRepository } from "@/server/repositories/ReservationRepository";
import crypto from "node:crypto";

async function runE2ECheck() {
  console.log("=== STARTING END-TO-END CONTACT OVERRIDE & VISIBILITY SYSTEM CHECK ===");

  await connectToDatabase();

  const testSuffix = crypto.randomBytes(4).toString("hex");
  const ownerId = `owner-e2e-${testSuffix}`;
  const customerId = `cust-e2e-${testSuffix}`;
  const adminId = `admin-e2e-${testSuffix}`;
  const propertyId = `prop-e2e-${testSuffix}`;
  const resId = `LM-2026-${testSuffix.toUpperCase()}`;

  // 1. Create property
  await PropertyModel.create({
    id: propertyId,
    ownerId,
    title: "Villa Sunset Mahdia",
    city: "Mahdia",
    rentalCategory: "summer",
    pricePerNight: 200,
    status: "APPROVED",
    isPublished: true,
  });

  // 2. Create reservation (Unconfirmed / Pending payment)
  const resDoc = await ReservationModel.create({
    id: resId,
    propertyId,
    ownerId,
    customerId,
    customerName: "Mohamed Ben Ali",
    customerPhone: "+21622123456",
    customerEmail: "mohamed.e2e@example.com",
    checkIn: new Date("2026-07-01"),
    checkOut: new Date("2026-07-10"),
    guests: 4,
    status: "CONFIRMED",
    pricing: { pricePerNight: 200, totalNights: 9, subtotal: 1800, total: 1800, currency: "TND" },
    paymentSummary: { paidAmount: 0, remainingAmount: 1800, status: "UNPAID" },
  });

  console.log(`[PASS] 1. Test data created: Reservation ${resId} for Property ${propertyId}`);

  // 3. Test Owner DTO before release
  const ownerResBefore = await reservationRepository.findById(resId, ownerId);
  console.log("Owner view before unlock/payment:", {
    contactVisibility: ownerResBefore.contactVisibility,
    customerName: ownerResBefore.customerName,
    customerPhone: ownerResBefore.customerPhone,
    customerEmail: ownerResBefore.customerEmail,
  });

  if (
    ownerResBefore.contactVisibility !== "HIDDEN" ||
    ownerResBefore.customerPhone !== null ||
    ownerResBefore.customerEmail !== null ||
    ownerResBefore.customerName !== "Mohamed A."
  ) {
    throw new Error("FAILED: Contact info was NOT properly masked for owner before release!");
  }
  console.log("[PASS] 2. Owner contact masking verified: Phone & Email are completely absent (null), Name anonymized.");

  // 4. Test Policy Evaluation
  const evalPending = ContactReleasePolicy.evaluate({
    reservationStatus: "CONFIRMED",
    paymentStatus: "UNPAID",
    paidAmount: 0,
    isAuthorizedOwner: true,
  });

  if (evalPending.visible !== false || evalPending.reason !== "PAYMENT_NOT_VALIDATED") {
    throw new Error("FAILED: Policy evaluation should deny unvalidated payment!");
  }
  console.log("[PASS] 3. ContactReleasePolicy evaluation verified for unpaid state.");

  // 5. Simulate Admin Unlock Action
  const unlockReason = "Support client : vérification téléphonique directe de la réservation";
  resDoc.contactAccessOverride = {
    enabled: true,
    grantedBy: adminId,
    grantedAt: new Date(),
    reason: unlockReason,
  };
  await resDoc.save();

  // Record Audit Log
  const auditEntry = await AuditLogModel.create({
    id: `audit-${crypto.randomBytes(8).toString("hex")}`,
    action: "CONTACT_ACCESS_OVERRIDE_GRANTED",
    actorId: adminId,
    actorRole: "ADMIN",
    targetType: "RESERVATION",
    targetId: resId,
    reason: unlockReason,
    details: { propertyId, ownerId, customerId },
  });

  console.log(`[PASS] 4. Admin Override saved and AuditLog recorded with ID: ${auditEntry.id}`);

  // 6. Test Owner DTO after Admin Unlock
  const ownerResAfter = await reservationRepository.findById(resId, ownerId);
  console.log("Owner view after admin unlock:", {
    contactVisibility: ownerResAfter.contactVisibility,
    customerName: ownerResAfter.customerName,
    customerPhone: ownerResAfter.customerPhone,
    customerEmail: ownerResAfter.customerEmail,
    paymentStatus: ownerResAfter.paymentSummary?.status,
  });

  if (
    ownerResAfter.contactVisibility !== "RELEASED" ||
    ownerResAfter.customerPhone !== "+21622123456" ||
    ownerResAfter.customerName !== "Mohamed Ben Ali"
  ) {
    throw new Error("FAILED: Owner did not get released contact info after admin unlock!");
  }

  // Critical Check: Verify payment status was NOT faked as paid
  if (ownerResAfter.paymentSummary?.status !== "UNPAID") {
    throw new Error("FAILED: Admin override improperly altered payment status!");
  }
  console.log("[PASS] 5. Admin Override releases contact info while PRESERVING exact UNPAID payment status.");

  // Clean up test records
  await ReservationModel.deleteOne({ id: resId });
  await PropertyModel.deleteOne({ id: propertyId });
  await AuditLogModel.deleteOne({ id: auditEntry.id });

  console.log("=== ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

runE2ECheck().catch((err) => {
  console.error("E2E CHECK FAILED:", err);
  process.exit(1);
});

