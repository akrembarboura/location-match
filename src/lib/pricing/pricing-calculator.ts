import type { PricingInput, PricingQuote } from "./pricing.types";

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

const MS_PER_DAY = 86_400_000;
const NIGHTS_PER_PERIOD = { week: 7, month: 30 } as const;

function utcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Calendar nights between two dates, ignoring time of day and DST. */
export function diffNights(checkIn: Date, checkOut: Date): number {
  return Math.round((utcDay(checkOut) - utcDay(checkIn)) / MS_PER_DAY);
}

/** checkIn + N calendar months, clamped to the end of shorter months (31 Jan + 1 month = 28/29 Feb). */
function addMonthsUTC(date: Date, months: number): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay));
}

function splitMonths(checkIn: Date, checkOut: Date) {
  const end = utcDay(checkOut);
  let whole = 0;
  while (addMonthsUTC(checkIn, whole + 1) <= end) whole++;
  const leftoverNights = Math.round((end - addMonthsUTC(checkIn, whole)) / MS_PER_DAY);
  return { whole, leftoverNights };
}

const round3 = (n: number) => Math.round(n * 1000) / 1000; // millimes

export function calculatePricing(input: PricingInput): PricingQuote {
  const { unitPrice, pricePeriod, checkIn, checkOut } = input;
  const currency = input.currency || "TND";
  const rule = input.partialPeriodRule || "prorate";

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new PricingError("Invalid unit price.");
  }
  if (!(checkIn instanceof Date) || !(checkOut instanceof Date) ||
      Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new PricingError("Invalid reservation dates.");
  }
  const nights = diffNights(checkIn, checkOut);
  if (nights < 1) {
    throw new PricingError("Check-out must be after check-in.");
  }

  let quantity: number;

  if (pricePeriod === "night") {
    quantity = nights;
  } else {
    let whole: number;
    let leftover: number;
    if (pricePeriod === "week") {
      whole = Math.floor(nights / 7);
      leftover = nights % 7;
    } else {
      const split = splitMonths(checkIn, checkOut);
      whole = split.whole;
      leftover = split.leftoverNights;
    }

    if (leftover === 0) {
      quantity = whole;
    } else if (rule === "reject") {
      throw new PricingError(`Stay of ${nights} nights is not a whole number of ${pricePeriod}s.`);
    } else if (rule === "ceil") {
      quantity = whole + 1;
    } else {
      quantity = whole + leftover / NIGHTS_PER_PERIOD[pricePeriod];
    }
  }

  const total = round3(unitPrice * quantity);
  return {
    unitPrice,
    pricePeriod,
    quantity: Math.round(quantity * 10_000) / 10_000,
    nights,
    subtotal: total,
    total,
    currency,
  };
}