import { calculatePricing, PricingError } from "./pricing-calculator";
import type { PartialPeriodRule, PricePeriod, PricingQuote } from "./pricing.types";

export interface PricedProperty {
  rentalCategory?: string;
  rentalCategories?: string[];
  pricing?: { price?: number; pricePeriod?: string; currency?: string } | null;
  pricePerNight?: number;
  summerPrice?: number;
  studentPrice?: number;
}

const isPositive = (n: unknown): boolean => Number.isFinite(Number(n)) && Number(n) > 0;
const isPeriod = (v: unknown): v is PricePeriod => v === "night" || v === "week" || v === "month";

function isStudent(prop: PricedProperty): boolean {
  return prop.rentalCategory === "student" || (Array.isArray(prop.rentalCategories) && prop.rentalCategories.includes("student"));
}

function isSummer(prop: PricedProperty): boolean {
  return prop.rentalCategory === "summer" || (Array.isArray(prop.rentalCategories) && prop.rentalCategories.includes("summer"));
}

/**
 * Resolves the authoritative price AND period for a property.
 * 1. Reads canonical `pricing` object first.
 * 2. If `pricing` has no period, defaults according to category (student = month, summer = week).
 * 3. Handles legacy fields correctly:
 *    - studentPrice -> "month"
 *    - summerPrice -> "week"
 *    - pricePerNight -> "night"
 * 4. Safe fallback returns unitPrice: 0 without throwing error in DTO mappings.
 */
export function resolvePropertyPricing(prop?: PricedProperty | null): {
  unitPrice: number;
  pricePeriod: PricePeriod;
  currency: string;
} {
  if (!prop) {
    return { unitPrice: 0, pricePeriod: "night", currency: "TND" };
  }

  // 1. Canonical pricing object
  if (prop.pricing && isPositive(prop.pricing.price)) {
    let period: PricePeriod = "night";
    if (isPeriod(prop.pricing.pricePeriod)) {
      period = prop.pricing.pricePeriod;
    } else if (isStudent(prop) || isPositive(prop.studentPrice)) {
      period = "month";
    } else if (isSummer(prop) || isPositive(prop.summerPrice)) {
      period = "week";
    } else {
      period = "month";
    }

    return {
      unitPrice: Number(prop.pricing.price),
      pricePeriod: period,
      currency: prop.pricing.currency || "TND",
    };
  }

  // 2. Legacy studentPrice -> monthly
  if (isPositive(prop.studentPrice)) {
    return {
      unitPrice: Number(prop.studentPrice),
      pricePeriod: "month",
      currency: "TND",
    };
  }

  // 3. Legacy summerPrice -> weekly
  if (isPositive(prop.summerPrice)) {
    return {
      unitPrice: Number(prop.summerPrice),
      pricePeriod: "week",
      currency: "TND",
    };
  }

  // 4. Legacy pricePerNight -> nightly
  if (isPositive(prop.pricePerNight)) {
    return {
      unitPrice: Number(prop.pricePerNight),
      pricePeriod: isStudent(prop) ? "month" : "night",
      currency: "TND",
    };
  }

  // Safe fallback
  return {
    unitPrice: 0,
    pricePeriod: isStudent(prop) ? "month" : "night",
    currency: "TND",
  };
}

export function quoteForProperty(
  prop: PricedProperty,
  checkIn: Date,
  checkOut: Date,
  partialPeriodRule?: PartialPeriodRule
): PricingQuote {
  const { unitPrice, pricePeriod, currency } = resolvePropertyPricing(prop);
  if (unitPrice <= 0) {
    throw new PricingError("This property has no price configured.");
  }
  return calculatePricing({ unitPrice, pricePeriod, checkIn, checkOut, currency, partialPeriodRule });
}