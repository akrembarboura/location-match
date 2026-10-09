import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { paymentRepository } from "@/server/repositories/PaymentRepository";
import { requestService } from "@/server/services/RequestService";
import { reservationRepository } from "@/server/repositories/ReservationRepository";
import { PaymentModel, ReservationModel, HousingRequestModel, PropertyModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

describe("LOC MAISON — Cross-User Payment Status Synchronization", () => {
  const mockOwnerId = "owner-sync-123";
  const mockCustomerId = "customer-sync-456";
  const mockPropertyId = "prop-sync-789";
  const mockRequestId = "REQ-SYNC-2026-TEST";
  const mockReservationId = "LM-SYNC-2026-TEST";

  beforeEach(async () => {
    await connectToDatabase();
    await PaymentModel.deleteMany({ reservationId: mockReservationId });
    await ReservationModel.deleteMany({ id: mockReservationId });
    await HousingRequestModel.deleteMany({ id: mockRequestId });
    await PropertyModel.deleteMany({ id: mockPropertyId });

    await PropertyModel.create({
      id: mockPropertyId,
      ownerId: mockOwnerId,
      title: "Appartement Corniche Mahdia",
      city: "Mahdia",
      pricing: { price: 1000, pricePeriod: "week" },
      status: "PUBLISHED",
    });

    await HousingRequestModel.create({
      id: mockRequestId,
      customerId: mockCustomerId,
      customer: { fullName: "Ali Mansour", phone: "+21622998877" },
      propertyId: mockPropertyId,
      selectedProperty: mockPropertyId,
      rentalCategory: "summer",
      destination: "Mahdia",
      status: "CONFIRMED",
      budget: 1000,
    });

    await ReservationModel.create({
      id: mockReservationId,
      requestId: mockRequestId,
      propertyId: mockPropertyId,
      ownerId: mockOwnerId,
      customerId: mockCustomerId,
      customerName: "Ali Mansour",
      customerPhone: "+21622998877",
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 7 * 86400000),
      guests: 2,
      status: "CONFIRMED",
      pricing: { total: 1000, currency: "TND" },
      paymentSummary: { paidAmount: 0, remainingAmount: 1000, status: "UNPAID" },
    });
  });

  afterEach(async () => {
    await PaymentModel.deleteMany({ reservationId: mockReservationId });
    await ReservationModel.deleteMany({ id: mockReservationId });
    await HousingRequestModel.deleteMany({ id: mockRequestId });
    await PropertyModel.deleteMany({ id: mockPropertyId });
  });

  it("1. Customer initial state: returns UNPAID before owner cash confirmation", async () => {
    const clientReq = await requestService.getClientRequest(mockRequestId);

    expect(clientReq).toBeDefined();
    expect(clientReq.payment).toBeDefined();
    expect(clientReq.payment.status).toBe("UNPAID");
  });

  it("2. Owner confirms cash receipt: updates DB and customer client API returns REPORTED payment state", async () => {
    // Owner confirms receipt of cash payment
    const result = await paymentRepository.reportCashPayment(mockOwnerId, mockReservationId, 1000);
    expect(result.success).toBe(true);

    // Fetch customer-facing request data directly from server
    const clientReq = await requestService.getClientRequest(mockRequestId);

    expect(clientReq.payment).toBeDefined();
    expect(clientReq.payment.status).toBe("REPORTED");
    expect(clientReq.payment.amount).toBe(1000);
    expect(clientReq.paymentSummary.status).toBe("REPORTED");

    // Fetch customer reservation directly from customer repository
    const custRes = await reservationRepository.findCustomerReservationById(mockReservationId, mockCustomerId);
    expect(custRes).toBeDefined();
    expect(custRes.payment).toBeDefined();
    expect(custRes.payment.status).toBe("REPORTED");
  });

  it("3. Admin verifies payment: customer client API returns VERIFIED/PAID state", async () => {
    const reportRes = await paymentRepository.reportCashPayment(mockOwnerId, mockReservationId, 1000);
    await paymentRepository.verifyPayment("admin-123", reportRes.payment.id);

    const clientReq = await requestService.getClientRequest(mockRequestId);
    expect(clientReq.payment.status).toBe("VERIFIED");
    expect(clientReq.paymentSummary.status).toBe("PAID");
    expect(clientReq.paymentSummary.paidAmount).toBe(1000);

    const custRes = await reservationRepository.findCustomerReservationById(mockReservationId, mockCustomerId);
    expect(custRes.payment.status).toBe("VERIFIED");
    expect(custRes.paymentSummary.status).toBe("PAID");
  });

  it("4. Owner reports cash with explicit paidMonths array: preserves paidMonths in reservation and client request summary", async () => {
    const customPaidMonths = ["2026-09", "2026-10"];
    const result = await paymentRepository.updatePaymentStatusByOwner(
      mockOwnerId,
      mockReservationId,
      "REPORTED",
      600,
      customPaidMonths
    );

    expect(result.success).toBe(true);
    expect(result.paymentSummary.paidMonths).toEqual(customPaidMonths);

    const clientReq = await requestService.getClientRequest(mockRequestId);
    expect(clientReq.paymentSummary.paidMonths).toEqual(customPaidMonths);
  });
});
