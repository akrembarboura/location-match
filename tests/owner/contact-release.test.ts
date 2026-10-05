import { describe, it, expect } from "vitest";
import { formatCustomerContactForOwner } from "@/server/repositories/ReservationRepository";

describe("Owner Controlled Customer Contact Release Rules", () => {
  it("Scenario A: Masks customer phone, email and anonymizes name when status is not CONFIRMED", () => {
    const rawRes = {
      status: "PENDING",
      paymentSummary: { status: "UNPAID", paidAmount: 0 },
      customerName: "Mohamed Ben Ali",
      customerPhone: "+21622123456",
      customerEmail: "mohamed@example.com",
    };

    const formatted = formatCustomerContactForOwner(rawRes);

    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
    expect(formatted.customerName).toBe("Mohamed A.");
  });

  it("Scenario B: Masks customer phone, email and anonymizes name when payment is UNPAID even if status is CONFIRMED", () => {
    const rawRes = {
      status: "CONFIRMED",
      paymentSummary: { status: "UNPAID", paidAmount: 0 },
      customerName: "Sonia Trabelsi",
      customerPhone: "+21698765432",
      customerEmail: "sonia@example.com",
    };

    const formatted = formatCustomerContactForOwner(rawRes);

    expect(formatted.contactVisibility).toBe("HIDDEN");
    expect(formatted.customerPhone).toBeNull();
    expect(formatted.customerEmail).toBeNull();
    expect(formatted.customerName).toBe("Sonia T.");
  });

  it("Scenario C: Releases full customer contact info ONLY when status is CONFIRMED and payment is validated", () => {
    const rawRes = {
      status: "CONFIRMED",
      paymentSummary: { status: "PAID", paidAmount: 1400 },
      customerName: "Ahmed Ben Salah",
      customerPhone: "+21650111222",
      customerEmail: "ahmed@example.com",
    };

    const formatted = formatCustomerContactForOwner(rawRes);

    expect(formatted.contactVisibility).toBe("RELEASED");
    expect(formatted.customerPhone).toBe("+21650111222");
    expect(formatted.customerEmail).toBe("ahmed@example.com");
    expect(formatted.customerName).toBe("Ahmed Ben Salah");
  });
});
