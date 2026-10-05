/**
 * Centralized Date Utilities for LOC MAISON Operational Calendar & Dashboard
 */

export interface RemainingDaysResult {
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  daysRemaining: number;
  daysUntilArrival: number;
  label: string;
}

export function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  return new Date(input);
}

/**
 * Normalizes a Date to midnight (00:00:00.000) for accurate day calculations
 */
export function startOfDay(date: Date | string): Date {
  const d = toDate(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Calculates number of nights between check-in and check-out
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = startOfDay(checkIn);
  const end = startOfDay(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Dynamic calculation of remaining stay or days until arrival
 */
export function calculateRemainingDays(
  checkIn: Date | string,
  checkOut: Date | string,
  now: Date = new Date()
): RemainingDaysResult {
  const today = startOfDay(now);
  const start = startOfDay(checkIn);
  const end = startOfDay(checkOut);

  const msPerDay = 1000 * 60 * 60 * 24;

  if (today < start) {
    const daysUntilArrival = Math.round((start.getTime() - today.getTime()) / msPerDay);
    const label = daysUntilArrival === 0 ? "Arrive aujourd'hui" : `Arrivée dans ${daysUntilArrival} jour${daysUntilArrival > 1 ? "s" : ""}`;
    return {
      status: "UPCOMING",
      daysRemaining: 0,
      daysUntilArrival,
      label,
    };
  }

  if (today <= end) {
    const daysRemaining = Math.round((end.getTime() - today.getTime()) / msPerDay);
    const label = daysRemaining === 0 ? "Départ aujourd'hui" : `⏳ ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""}`;
    return {
      status: "ACTIVE",
      daysRemaining,
      daysUntilArrival: 0,
      label,
    };
  }

  return {
    status: "COMPLETED",
    daysRemaining: 0,
    daysUntilArrival: 0,
    label: "Séjour terminé",
  };
}

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

const MONTHS_FR_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc."
];

export function formatDateFr(
  date: Date | string | null | undefined,
  options: { includeYear?: boolean; shortMonth?: boolean } = {}
): string {
  if (!date) return "—";
  const d = toDate(date);
  if (isNaN(d.getTime())) return "—";

  const day = d.getDate();
  const monthList = options.shortMonth ? MONTHS_FR_SHORT : MONTHS_FR;
  const month = monthList[d.getMonth()];
  const year = d.getFullYear();

  if (options.includeYear) {
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month}`;
}

export function formatDateRangeFr(
  checkIn: Date | string,
  checkOut: Date | string,
  includeYear = false
): string {
  const start = toDate(checkIn);
  const end = toDate(checkOut);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Dates non spécifiées";

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTHS_FR[start.getMonth()];
  const endMonth = MONTHS_FR[end.getMonth()];
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} → ${endDay} ${endMonth}${includeYear ? ` ${year}` : ""}`;
  }
  return `${startDay} ${startMonth} → ${endDay} ${endMonth}${includeYear ? ` ${year}` : ""}`;
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = toDate(d1);
  const date2 = toDate(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isWithinThisWeek(date: Date | string, refDate: Date = new Date()): boolean {
  const d = startOfDay(date);
  const ref = startOfDay(refDate);
  const diffDays = Math.round((d.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}
