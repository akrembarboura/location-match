import { describe, it, expect } from "vitest";
import { calculatePricing } from "./pricing-calculator";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("calculatePricing", () => {
  it("monthly price, 15 Oct -> 15 Jun = 8 months = 9,600", () => {
    const q = calculatePricing({ unitPrice: 1200, pricePeriod: "month", checkIn: d("2026-10-15"), checkOut: d("2027-06-15") });
    expect(q.quantity).toBe(8);
    expect(q.total).toBe(9600);
  });
  it("nightly price keeps old behaviour", () => {
    const q = calculatePricing({ unitPrice: 150, pricePeriod: "night", checkIn: d("2026-07-01"), checkOut: d("2026-07-08") });
    expect(q.total).toBe(1050);
  });
  it("weekly price, 14 nights = 2 weeks", () => {
    const q = calculatePricing({ unitPrice: 900, pricePeriod: "week", checkIn: d("2026-07-01"), checkOut: d("2026-07-15") });
    expect(q.total).toBe(1800);
  });
  it("partial month, prorate: 8 months + 5 nights", () => {
    const q = calculatePricing({ unitPrice: 1200, pricePeriod: "month", checkIn: d("2026-10-15"), checkOut: d("2027-06-20") });
    expect(q.total).toBe(9800);
  });
  it("partial month, ceil: 9 months", () => {
    const q = calculatePricing({ unitPrice: 1200, pricePeriod: "month", checkIn: d("2026-10-15"), checkOut: d("2027-06-20"), partialPeriodRule: "ceil" });
    expect(q.total).toBe(10800);
  });
  it("partial month, reject throws", () => {
    expect(() => calculatePricing({ unitPrice: 1200, pricePeriod: "month", checkIn: d("2026-10-15"), checkOut: d("2027-06-20"), partialPeriodRule: "reject" })).toThrow();
  });
  it("31 Jan -> 28 Feb is exactly one month", () => {
    const q = calculatePricing({ unitPrice: 500, pricePeriod: "month", checkIn: d("2027-01-31"), checkOut: d("2027-02-28") });
    expect(q.total).toBe(500);
  });
  it("rejects bad input", () => {
    expect(() => calculatePricing({ unitPrice: 0, pricePeriod: "night", checkIn: d("2026-07-01"), checkOut: d("2026-07-02") })).toThrow();
    expect(() => calculatePricing({ unitPrice: 100, pricePeriod: "night", checkIn: d("2026-07-02"), checkOut: d("2026-07-01") })).toThrow();
  });
});