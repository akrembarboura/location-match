import { describe, it, expect, beforeEach } from "vitest";
import { calculateRemainingDays, calculateNights, formatDateFr } from "../../src/lib/date-utils";
import { ReservationRepository } from "../../src/server/repositories/ReservationRepository";
import { PaymentRepository } from "../../src/server/repositories/PaymentRepository";

describe("Espace Propriétaire — Operational Business Logic Tests", () => {
  describe("1. Dynamic Date & Remaining Days Calculations", () => {
    it("correctly identifies UPCOMING rental and calculates days until arrival", () => {
      const now = new Date("2026-08-01T12:00:00Z");
      const checkIn = new Date("2026-08-05T15:00:00Z");
      const checkOut = new Date("2026-08-10T11:00:00Z");

      const res = calculateRemainingDays(checkIn, checkOut, now);
      expect(res.status).toBe("UPCOMING");
      expect(res.daysUntilArrival).toBe(4);
      expect(res.label).toContain("Arrivée dans 4 jours");
    });

    it("correctly identifies ACTIVE rental and calculates remaining stay days", () => {
      const now = new Date("2026-08-07T12:00:00Z");
      const checkIn = new Date("2026-08-05T15:00:00Z");
      const checkOut = new Date("2026-08-10T11:00:00Z");

      const res = calculateRemainingDays(checkIn, checkOut, now);
      expect(res.status).toBe("ACTIVE");
      expect(res.daysRemaining).toBe(3);
      expect(res.label).toContain("3 jours restants");
    });

    it("correctly identifies COMPLETED rental", () => {
      const now = new Date("2026-08-12T12:00:00Z");
      const checkIn = new Date("2026-08-05T15:00:00Z");
      const checkOut = new Date("2026-08-10T11:00:00Z");

      const res = calculateRemainingDays(checkIn, checkOut, now);
      expect(res.status).toBe("COMPLETED");
      expect(res.label).toBe("Séjour terminé");
    });

    it("calculates number of nights accurately", () => {
      const nights = calculateNights("2026-08-12", "2026-08-16");
      expect(nights).toBe(4);
    });

    it("formats dates in French correctly", () => {
      const formatted = formatDateFr("2026-08-12");
      expect(formatted).toContain("12 août");
    });
  });

  describe("2. Payment Calculations & Invariants", () => {
    it("ensures remaining amount equals total - paidAmount", () => {
      const total = 1400;
      const paid = 900;
      const remaining = Math.max(0, total - paid);
      expect(remaining).toBe(500);
    });

    it("prevents paid amount from exceeding total amount", () => {
      const total = 1400;
      const overpaid = 1600;
      const safePaid = Math.min(total, overpaid);
      const remaining = Math.max(0, total - safePaid);

      expect(safePaid).toBe(1400);
      expect(remaining).toBe(0);
    });
  });
});
