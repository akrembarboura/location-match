import { describe, it, expect } from "vitest";
import { calculatePaymentSchedule } from "@/lib/pricing/payment-schedule";

describe("PaymentScheduleView & Payment Reporting — Zero Auto-Check & Idempotent Selection", () => {
  const baseReservation = {
    rentalCategory: "student",
    checkIn: "2026-09-01",
    checkOut: "2026-12-31", // 4 Months: Sept, Oct, Nov, Dec 2026
    pricing: {
      total: 2400,
      unitPrice: 600,
      pricePeriod: "month",
      currency: "TND",
    },
  };

  it("1. Initial state (untouched) has 0 auto-checked boxes", () => {
    const result = calculatePaymentSchedule({
      ...baseReservation,
      paymentSummary: {
        paidAmount: 0,
        reportedAmount: 0,
        status: "UNPAID",
      },
    });

    expect(result.schedule.filter((m) => m.status === "PAID")).toHaveLength(0);
    expect(result.schedule.filter((m) => m.status === "UNPAID")).toHaveLength(4);
  });

  it("2. User checks ONLY Month 1 (2026-09) — Only Month 1 is checked, 3 remain unchecked", () => {
    const result = calculatePaymentSchedule({
      ...baseReservation,
      paymentSummary: {
        paidAmount: 0,
        reportedAmount: 600,
        status: "REPORTED",
        paidMonths: ["2026-09"],
      },
    });

    const paid = result.schedule.filter((m) => m.status === "PAID");
    expect(paid).toHaveLength(1);
    expect(paid[0].monthKey).toBe("2026-09");

    const unpaid = result.schedule.filter((m) => m.status === "UNPAID");
    expect(unpaid).toHaveLength(3);
  });

  it("3. Repeated clicks on Payé preserve exact user choice without force-checking all boxes", () => {
    const userChoice = ["2026-09"];

    // Simulate 5 repeated clicks on "Payé (Enregistré)" button
    for (let click = 1; click <= 5; click++) {
      const result = calculatePaymentSchedule({
        ...baseReservation,
        paymentSummary: {
          paidAmount: 0,
          reportedAmount: 600,
          status: "REPORTED",
          paidMonths: userChoice,
        },
      });

      const checked = result.schedule.filter((m) => m.status === "PAID").map((m) => m.monthKey);
      expect(checked).toEqual(["2026-09"]);
      expect(result.schedule.filter((m) => m.status === "UNPAID")).toHaveLength(3);
    }
  });

  it("4. User checks Month 1 and Month 3 — Non-contiguous selection is preserved strictly", () => {
    const userChoice = ["2026-09", "2026-11"];

    const result = calculatePaymentSchedule({
      ...baseReservation,
      paymentSummary: {
        paidAmount: 0,
        reportedAmount: 1200,
        status: "REPORTED",
        paidMonths: userChoice,
      },
    });

    expect(result.schedule[0].status).toBe("PAID");   // Sept
    expect(result.schedule[1].status).toBe("UNPAID"); // Oct
    expect(result.schedule[2].status).toBe("PAID");   // Nov
    expect(result.schedule[3].status).toBe("UNPAID"); // Dec
  });

  it("5. Clearing all check boxes sets paidMonths to [] with 0 checked boxes", () => {
    const result = calculatePaymentSchedule({
      ...baseReservation,
      paymentSummary: {
        paidAmount: 0,
        reportedAmount: 0,
        status: "UNPAID",
        paidMonths: [],
      },
    });

    expect(result.schedule.filter((m) => m.status === "PAID")).toHaveLength(0);
    expect(result.schedule.filter((m) => m.status === "UNPAID")).toHaveLength(4);
  });

  it("6. Amount independence: reportedAmount=2400 does NOT auto-check any boxes if paidMonths is empty", () => {
    const result = calculatePaymentSchedule({
      ...baseReservation,
      paymentSummary: {
        paidAmount: 0,
        reportedAmount: 2400,
        status: "REPORTED",
        paidMonths: [],
      },
    });

    expect(result.schedule.filter((m) => m.status === "PAID")).toHaveLength(0);
    expect(result.schedule.filter((m) => m.status === "UNPAID")).toHaveLength(4);
  });

  it("7. Single-month unchecking: unchecking Sept from [Sept, Oct] leaves only Oct checked", () => {
    const initialPaid = ["2026-09", "2026-10"];
    const monthToRemove = "2026-09";
    const updatedPaid = initialPaid.filter((m) => m !== monthToRemove);

    const result = calculatePaymentSchedule({
      ...baseReservation,
      paymentSummary: {
        paidAmount: 0,
        reportedAmount: 600,
        status: "REPORTED",
        paidMonths: updatedPaid,
      },
    });

    const checkedKeys = result.schedule.filter((m) => m.status === "PAID").map((m) => m.monthKey);
    expect(checkedKeys).toEqual(["2026-10"]);
  });

  it("8. Idempotent clearing: saving empty selection repeatedly never restores old paid months", () => {
    for (let click = 1; click <= 3; click++) {
      const result = calculatePaymentSchedule({
        ...baseReservation,
        paymentSummary: {
          paidAmount: 0,
          reportedAmount: 0,
          status: "UNPAID",
          paidMonths: [],
        },
      });

      expect(result.schedule.filter((m) => m.status === "PAID")).toHaveLength(0);
    }
  });
});
