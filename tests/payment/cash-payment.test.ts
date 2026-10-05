import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { formatCustomerContactForOwner } from "@/server/repositories/ReservationRepository";
import { paymentRepository } from "@/server/repositories/PaymentRepository";
import { PaymentModel, ReservationModel, PropertyModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

describe("Dynamic Payment System with Cash Confirmation", () => {
  const mockOwnerId = "owner-123";
  const mockOtherOwnerId = "owner-456";
  const mockAdminId = "admin-789";
  const mockPropertyId = "prop-100";
  const mockReservationId = "LM-2026-TEST-CASH";

  beforeEach(async () => {
    await connectToDatabase();
    await PaymentModel.deleteMany({ reservationId: mockReservationId });
    await ReservationModel.deleteMany({ id: mockReservationId });
    await PropertyModel.deleteMany({ id: mockPropertyId });

    await PropertyModel.create({
      id: mockPropertyId,
      ownerId: mockOwnerId,
      title: "Villa Sidi Salem",
      city: "Mahdia",
      pricing: { price: 1200, pricePeriod: "week" },
      status: "PUBLISHED",
    });

    await ReservationModel.create({
      id: mockReservationId,
      propertyId: mockPropertyId,
      ownerId: mockOwnerId,
      customerName: "Mohamed Ben Ali",
      customerPhone: "+21622123456",
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 7 * 86400000),
      guests: 4,
      status: "CONFIRMED",
      pricing: { total: 1200, currency: "TND" },
      paymentSummary: { paidAmount: 0, remainingAmount: 1200, status: "UNPAID" },
    });
  });

  afterEach(async () => {
    await PaymentModel.deleteMany({ reservationId: mockReservationId });
    await ReservationModel.deleteMany({ id: mockReservationId });
    await PropertyModel.deleteMany({ id: mockPropertyId });
  });

  it("1. Owner confirms cash received -> status becomes REPORTED, not automatically VERIFIED", async () => {
    const result = await paymentRepository.reportCashPayment(mockOwnerId, mockReservationId, 1200);

    expect(result.success).toBe(true);
    expect(result.payment.status).toBe("REPORTED");
    expect(result.payment.method).toBe("CASH");
    expect(result.payment.amount).toBe(1200);
    expect(result.payment.reportedBy.userId).toBe(mockOwnerId);
    expect(result.payment.reportedBy.role).toBe("OWNER");
    expect(result.payment.reportedAt).toBeDefined();

    // Check reservation paymentSummary
    const updatedRes = await ReservationModel.findOne({ id: mockReservationId }).lean().exec();
    expect(updatedRes.paymentSummary.status).toBe("REPORTED");
    expect(updatedRes.paymentSummary.reportedAmount).toBe(1200);
    expect(updatedRes.paymentSummary.paidAmount).toBe(0); // Verified amount is still 0!
  });

  it("2. Prevent double confirmation / double reporting", async () => {
    await paymentRepository.reportCashPayment(mockOwnerId, mockReservationId, 1200);

    await expect(
      paymentRepository.reportCashPayment(mockOwnerId, mockReservationId, 1200)
    ).rejects.toThrow("déjà été déclaré ou confirmé");
  });

  it("3. Unauthorized owner cannot report cash for another owner's reservation", async () => {
    await expect(
      paymentRepository.reportCashPayment(mockOtherOwnerId, mockReservationId, 1200)
    ).rejects.toThrow("pas le propriétaire");
  });

  it("4. Contact release invariant: REPORTED keeps contact HIDDEN; VERIFIED releases contact", async () => {
    // Step 1: Cash reported by owner
    const reportRes = await paymentRepository.reportCashPayment(mockOwnerId, mockReservationId, 1200);
    const updatedRes1 = await ReservationModel.findOne({ id: mockReservationId }).lean().exec();

    // Verify contact is still HIDDEN when only REPORTED
    const formattedHidden = formatCustomerContactForOwner(updatedRes1);
    expect(formattedHidden.contactVisibility).toBe("HIDDEN");
    expect(formattedHidden.customerPhone).toBeNull();

    // Step 2: Admin verifies payment
    await paymentRepository.verifyPayment(mockAdminId, reportRes.payment.id);
    const updatedRes2 = await ReservationModel.findOne({ id: mockReservationId }).lean().exec();

    expect(updatedRes2.paymentSummary.status).toBe("PAID");
    expect(updatedRes2.paymentSummary.paidAmount).toBe(1200);

    // Verify contact is RELEASED after VERIFIED
    const formattedReleased = formatCustomerContactForOwner(updatedRes2);
    expect(formattedReleased.contactVisibility).toBe("RELEASED");
    expect(formattedReleased.customerPhone).toBe("+21622123456");
  });

  it("5. Admin can verify or reject reported payments", async () => {
    const reportRes = await paymentRepository.reportCashPayment(mockOwnerId, mockReservationId, 1200);

    // Verify
    const verifyRes = await paymentRepository.verifyPayment(mockAdminId, reportRes.payment.id);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.payment.status).toBe("VERIFIED");
    expect(verifyRes.payment.verifiedBy.userId).toBe(mockAdminId);
  });
});
