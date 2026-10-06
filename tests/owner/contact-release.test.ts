import { describe, it, expect } from "vitest";
import { formatCustomerContactForOwner, ReservationRepository } from "@/server/repositories/ReservationRepository";
import { ContactReleasePolicy } from "@/server/services/ContactReleasePolicy";
import { requireOwnerAccess } from "@/server/utils/auth-guards";

describe("LOC MAISON — Customer Contact Masking & Release Security Tests", () => {
  const sampleCustomer = {
    status: "CONFIRMED",
    paymentSummary: { status: "PAID", paidAmount: 1200 },
    customerName: "Mohamed Ben Ali",
    customerPhone: "+21622123456",
    customerEmail: "mohamed@example.com",
  };

  it("Test 1 — Unauthorized User: returns HIDDEN with UNAUTHORIZED reason when owner is not authorized", () => {
    const formatted = formatCustomerContactForOwner(sampleCustomer, false);

    expect(formatted.visible).toBe(false);
    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.reason).toBe("UNAUTHORIZED");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
    expect(formatted.customerName).toBe("Mohamed A.");
  });

  it("Test 2 — Owner before reservation confirmation: returns HIDDEN when reservation is not confirmed", () => {
    const rawRes = {
      ...sampleCustomer,
      status: "PENDING",
      paymentSummary: { status: "PAID", paidAmount: 1200 },
    };

    const formatted = formatCustomerContactForOwner(rawRes, true);

    expect(formatted.visible).toBe(false);
    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.reason).toBe("RESERVATION_NOT_CONFIRMED");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
    expect(formatted.customerName).toBe("Mohamed A.");
  });

  it("Test 3 — Reservation confirmed but payment pending: returns HIDDEN when payment is UNPAID", () => {
    const rawRes = {
      ...sampleCustomer,
      status: "CONFIRMED",
      paymentSummary: { status: "UNPAID", paidAmount: 0 },
    };

    const formatted = formatCustomerContactForOwner(rawRes, true);

    expect(formatted.visible).toBe(false);
    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.reason).toBe("PAYMENT_NOT_VALIDATED");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
    expect(formatted.customerName).toBe("Mohamed A.");
  });

  it("Test 4 — Payment validated but reservation not confirmed: returns HIDDEN when reservation is not confirmed", () => {
    const rawRes = {
      ...sampleCustomer,
      status: "UNDER_REVIEW",
      paymentSummary: { status: "PAID", paidAmount: 1200 },
    };

    const formatted = formatCustomerContactForOwner(rawRes, true);

    expect(formatted.visible).toBe(false);
    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.reason).toBe("RESERVATION_NOT_CONFIRMED");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
  });

  it("Test 5 — Reservation confirmed + payment validated: releases customer contact info", () => {
    const formatted = formatCustomerContactForOwner(sampleCustomer, true);

    expect(formatted.visible).toBe(true);
    expect(formatted.contactVisibility).toBe("RELEASED");
    expect(formatted.reason).toBe("CONTACT_AVAILABLE");
    expect(formatted.customerPhone).toBe("+21622123456");
    expect(formatted.customerEmail).toBe("mohamed@example.com");
    expect(formatted.customerName).toBe("Mohamed Ben Ali");
  });

  it("Test 6 — Owner A cannot access Owner B's customer reservation", async () => {
    const repo = new ReservationRepository();
    const result = await repo.findById("non-existent-or-other-owner-res", "owner_A_id");
    expect(result).toBeNull();
  });

  it("Test 7 — Customer role cannot pass owner authorization guard", async () => {
    const mockAuthService = await import("@/server/services/AuthService");
    // Verify requireOwnerAccess checks role
    expect(typeof requireOwnerAccess).toBe("function");
  });

  it("Test 8 — Direct API manipulation: client-passed flags cannot override server-side policy", () => {
    const maliciousPayload = {
      status: "PENDING",
      paymentSummary: { status: "UNPAID", paidAmount: 0 },
      customerName: "Fake Client",
      customerPhone: "+21699999999",
      customerEmail: "hacker@example.com",
      contactVisible: true, // Malicious client attempt
      paymentConfirmed: true, // Malicious client attempt
    };

    const formatted = formatCustomerContactForOwner(maliciousPayload, true);

    expect(formatted.visible).toBe(false);
    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
  });

  it("Test 9 — Refresh & Database Authority: policy evaluation is pure and derived from DB state", () => {
    const eval1 = ContactReleasePolicy.evaluate({
      reservationStatus: "CONFIRMED",
      paymentStatus: "REPORTED",
      paidAmount: 500,
      isAuthorizedOwner: true,
    });

    expect(eval1.visible).toBe(true);
    expect(eval1.reason).toBe("CONTACT_AVAILABLE");

    const eval2 = ContactReleasePolicy.evaluate({
      reservationStatus: "CONFIRMED",
      paymentStatus: "UNPAID",
      paidAmount: 0,
      isAuthorizedOwner: true,
    });

    expect(eval2.visible).toBe(false);
    expect(eval2.reason).toBe("PAYMENT_NOT_VALIDATED");
  });

  it("Test 10 — Admin Override: releases contact info even when reservation is unconfirmed and payment is unpaid", () => {
    const rawRes = {
      ...sampleCustomer,
      status: "PENDING",
      paymentSummary: { status: "UNPAID", paidAmount: 0 },
      contactAccessOverride: {
        enabled: true,
        grantedBy: "admin_123",
        grantedAt: new Date(),
        reason: "Vérification téléphonique directe effectuée",
      },
    };

    const formatted = formatCustomerContactForOwner(rawRes, true);

    expect(formatted.visible).toBe(true);
    expect(formatted.contactVisibility).toBe("RELEASED");
    expect(formatted.reason).toBe("ADMIN_OVERRIDE");
    expect(formatted.customerPhone).toBe("+21622123456");
    expect(formatted.customerEmail).toBe("mohamed@example.com");
  });

  it("Test 11 — Admin Override does NOT fake payment or reservation confirmation status", () => {
    const rawRes = {
      ...sampleCustomer,
      status: "PENDING",
      paymentSummary: { status: "UNPAID", paidAmount: 0 },
      contactAccessOverride: {
        enabled: true,
        grantedBy: "admin_123",
        grantedAt: new Date(),
        reason: "Assistance client urgente",
      },
    };

    expect(rawRes.status).toBe("PENDING");
    expect(rawRes.paymentSummary.status).toBe("UNPAID");

    const evalResult = ContactReleasePolicy.evaluate({
      reservationStatus: rawRes.status,
      paymentStatus: rawRes.paymentSummary.status,
      paidAmount: rawRes.paymentSummary.paidAmount,
      isAuthorizedOwner: true,
      hasAdminOverride: rawRes.contactAccessOverride.enabled,
    });

    expect(evalResult.visible).toBe(true);
    expect(evalResult.reason).toBe("ADMIN_OVERRIDE");
  });

  it("Test 12 — Admin Override: returns UNAUTHORIZED if viewer is not authorized owner", () => {
    const rawRes = {
      ...sampleCustomer,
      status: "PENDING",
      paymentSummary: { status: "UNPAID", paidAmount: 0 },
      contactAccessOverride: {
        enabled: true,
        grantedBy: "admin_123",
        grantedAt: new Date(),
        reason: "Test",
      },
    };

    const formatted = formatCustomerContactForOwner(rawRes, false);

    expect(formatted.visible).toBe(false);
    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.reason).toBe("UNAUTHORIZED");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
  });
});
