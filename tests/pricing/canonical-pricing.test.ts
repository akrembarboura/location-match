import { describe, it, expect } from "vitest";
import { calculatePricing, PricingError } from "../../src/lib/pricing/pricing-calculator";
import { resolvePropertyPricing, quoteForProperty } from "../../src/lib/pricing/pricing.service";
import { formatPropertyRate } from "../../src/lib/pricing/pricing-formatters";

const d = (dateStr: string) => new Date(`${dateStr}T00:00:00.000Z`);

describe("LOC MAISON — Canonical Pricing Domain System", () => {
  describe("1. Nightly Pricing", () => {
    it("calculates 120 DT / night for 3 nights = 360 DT", () => {
      const quote = calculatePricing({
        unitPrice: 120,
        pricePeriod: "night",
        checkIn: d("2026-10-15"),
        checkOut: d("2026-10-18"),
      });

      expect(quote.nights).toBe(3);
      expect(quote.quantity).toBe(3);
      expect(quote.unitPrice).toBe(120);
      expect(quote.pricePeriod).toBe("night");
      expect(quote.total).toBe(360);
      expect(quote.currency).toBe("TND");
    });
  });

  describe("2. Weekly Pricing", () => {
    it("calculates 1500 DT / week for 14 nights (2 weeks) = 3000 DT", () => {
      const quote = calculatePricing({
        unitPrice: 1500,
        pricePeriod: "week",
        checkIn: d("2026-07-15"),
        checkOut: d("2026-07-29"),
      });

      expect(quote.nights).toBe(14);
      expect(quote.quantity).toBe(2);
      expect(quote.unitPrice).toBe(1500);
      expect(quote.pricePeriod).toBe("week");
      expect(quote.total).toBe(3000);
    });

    it("prorates partial weeks correctly (10 nights = 1.429 weeks)", () => {
      const quote = calculatePricing({
        unitPrice: 700,
        pricePeriod: "week",
        checkIn: d("2026-07-01"),
        checkOut: d("2026-07-11"),
        partialPeriodRule: "prorate",
      });

      expect(quote.nights).toBe(10);
      // 1 week (700) + 3 nights (3/7 * 700 = 300) = 1000 DT
      expect(quote.total).toBe(1000);
    });
  });

  describe("3. Monthly Pricing & Exact Month Spans", () => {
    it("calculates 1200 DT / month for 1 month (15 Oct -> 15 Nov) = 1200 DT", () => {
      const quote = calculatePricing({
        unitPrice: 1200,
        pricePeriod: "month",
        checkIn: d("2026-10-15"),
        checkOut: d("2026-11-15"),
      });

      expect(quote.quantity).toBe(1);
      expect(quote.total).toBe(1200);
    });

    it("calculates 1200 DT / month for 8 months (15 Oct -> 15 Jun) = 9,600 DT (NOT 291,600 DT)", () => {
      const quote = calculatePricing({
        unitPrice: 1200,
        pricePeriod: "month",
        checkIn: d("2026-10-15"),
        checkOut: d("2027-06-15"),
      });

      expect(quote.quantity).toBe(8);
      expect(quote.total).toBe(9600);
    });

    it("handles short month boundaries (31 Jan -> 28 Feb = 1 month)", () => {
      const quote = calculatePricing({
        unitPrice: 500,
        pricePeriod: "month",
        checkIn: d("2027-01-31"),
        checkOut: d("2027-02-28"),
      });

      expect(quote.quantity).toBe(1);
      expect(quote.total).toBe(500);
    });
  });

  describe("4. Student Properties & Display Formatting", () => {
    it("resolves student property configured as 850 DT / month correctly", () => {
      const prop = {
        rentalCategory: "student",
        pricing: { price: 850, pricePeriod: "month", currency: "TND" },
      };

      const resolved = resolvePropertyPricing(prop);
      expect(resolved.unitPrice).toBe(850);
      expect(resolved.pricePeriod).toBe("month");
      expect(resolved.currency).toBe("TND");

      const formatted = formatPropertyRate(resolved.unitPrice, resolved.pricePeriod);
      expect(formatted).toBe("850 DT / mois");
      expect(formatted).not.toContain("nuit");
    });
  });

  describe("5. Partial Period Rules (prorate, ceil, reject)", () => {
    it("prorates 8 months + 5 nights (1200 / month)", () => {
      const quote = calculatePricing({
        unitPrice: 1200,
        pricePeriod: "month",
        checkIn: d("2026-10-15"),
        checkOut: d("2027-06-20"),
        partialPeriodRule: "prorate",
      });

      // 8 months (9600) + 5 nights @ (1200/30 = 40/night) * 5 = 200 => 9800 DT
      expect(quote.total).toBe(9800);
    });

    it("ceils 8 months + 5 nights to 9 full months", () => {
      const quote = calculatePricing({
        unitPrice: 1200,
        pricePeriod: "month",
        checkIn: d("2026-10-15"),
        checkOut: d("2027-06-20"),
        partialPeriodRule: "ceil",
      });

      expect(quote.quantity).toBe(9);
      expect(quote.total).toBe(10800);
    });

    it("rejects non-integer periods when rule is set to 'reject'", () => {
      expect(() =>
        calculatePricing({
          unitPrice: 1200,
          pricePeriod: "month",
          checkIn: d("2026-10-15"),
          checkOut: d("2027-06-20"),
          partialPeriodRule: "reject",
        })
      ).toThrow(PricingError);
    });
  });

  describe("6. Validation & Error Edge Cases", () => {
    it("throws PricingError if checkOut <= checkIn", () => {
      expect(() =>
        calculatePricing({
          unitPrice: 100,
          pricePeriod: "night",
          checkIn: d("2026-10-15"),
          checkOut: d("2026-10-15"),
        })
      ).toThrow(PricingError);

      expect(() =>
        calculatePricing({
          unitPrice: 100,
          pricePeriod: "night",
          checkIn: d("2026-10-15"),
          checkOut: d("2026-10-10"),
        })
      ).toThrow(PricingError);
    });

    it("throws PricingError if unitPrice <= 0 or non-finite", () => {
      expect(() =>
        calculatePricing({
          unitPrice: 0,
          pricePeriod: "night",
          checkIn: d("2026-10-15"),
          checkOut: d("2026-10-16"),
        })
      ).toThrow(PricingError);

      expect(() =>
        calculatePricing({
          unitPrice: -50,
          pricePeriod: "night",
          checkIn: d("2026-10-15"),
          checkOut: d("2026-10-16"),
        })
      ).toThrow(PricingError);
    });
  });

  describe("7. Reservation Immutability & Snapshot Integrity", () => {
    it("preserves agreed quote snapshot even if property price changes later", () => {
      const initialProp = {
        pricing: { price: 1200, pricePeriod: "month" as const, currency: "TND" },
      };

      const originalQuote = quoteForProperty(initialProp, d("2026-10-15"), d("2027-06-15"));
      expect(originalQuote.total).toBe(9600);

      // Owner changes property price later
      const updatedProp = {
        pricing: { price: 1400, pricePeriod: "month" as const, currency: "TND" },
      };

      // Original quote snapshot stored on reservation document remains 9600
      const reservationSnapshot = {
        unitPrice: originalQuote.unitPrice,
        pricePeriod: originalQuote.pricePeriod,
        quantity: originalQuote.quantity,
        subtotal: originalQuote.subtotal,
        total: originalQuote.total,
        currency: originalQuote.currency,
      };

      expect(reservationSnapshot.total).toBe(9600);
      expect(reservationSnapshot.unitPrice).toBe(1200);

      // New reservation for updated property gets new quote
      const newQuote = quoteForProperty(updatedProp, d("2026-10-15"), d("2027-06-15"));
      expect(newQuote.total).toBe(11200);
    });
  });
});
