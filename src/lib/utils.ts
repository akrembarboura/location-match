import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDT(v: number) {
  return new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v);
}

