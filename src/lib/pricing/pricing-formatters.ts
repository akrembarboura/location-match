import type { PricePeriod } from "./pricing.types";

const PERIOD_LABELS: Record<PricePeriod, string> = {
  night: "nuit",
  week: "semaine",
  month: "mois",
};

export function formatPricePeriod(period: string | undefined | null): string {
  if (period === "month") return "mois";
  if (period === "week") return "semaine";
  return "nuit";
}

export function formatPropertyRate(price: number, period?: string | null, currency: string = "DT"): string {
  const formattedPrice = new Intl.NumberFormat("fr-FR").format(Math.round(price));
  const formattedPeriod = formatPricePeriod(period);
  return `${formattedPrice} ${currency} / ${formattedPeriod}`;
}
