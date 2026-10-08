export type PricePeriod = "night" | "week" | "month";

/**
 * What to do when the stay is not a whole number of periods
 * (e.g. 15 Oct -> 20 Jun on a monthly price = 8 months + 5 nights).
 * - "prorate": leftover nights are charged at unitPrice / 7 (week) or unitPrice / 30 (month)
 * - "ceil":    any leftover rounds up to one more full period
 * - "reject":  throw, only whole periods are bookable
 */
export type PartialPeriodRule = "prorate" | "ceil" | "reject";

export interface PricingInput {
  unitPrice: number;
  pricePeriod: PricePeriod;
  checkIn: Date;
  checkOut: Date;
  currency?: string;
  partialPeriodRule?: PartialPeriodRule;
}

export interface PricingQuote {
  unitPrice: number;
  pricePeriod: PricePeriod;
  /** Number of periods charged (can be fractional with "prorate") */
  quantity: number;
  nights: number;
  subtotal: number;
  total: number;
  currency: string;
}