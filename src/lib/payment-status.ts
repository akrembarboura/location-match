/**
 * Centralized Payment Status helpers for LOC MAISON.
 * Ensures 100% consistent translation & UI representation between Owner & Customer.
 */

export type CanonicalPaymentStatus =
  | "PENDING"
  | "UNPAID"
  | "AWAITING_OWNER_CONFIRMATION"
  | "REPORTED"
  | "VERIFIED"
  | "CONFIRMED"
  | "PAID"
  | "PARTIALLY_PAID"
  | "REJECTED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export interface PaymentStatusConfig {
  key: string;
  label: string;
  badgeClass: string;
  isConfirmed: boolean;
  isReported: boolean;
  isPending: boolean;
}

export function formatPaymentStatus(status?: string): PaymentStatusConfig {
  const normalized = (status || "UNPAID").toUpperCase();

  switch (normalized) {
    case "CONFIRMED":
    case "VERIFIED":
    case "PAID":
      return {
        key: "CONFIRMED",
        label: "Paiement confirmé",
        badgeClass:
          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        isConfirmed: true,
        isReported: false,
        isPending: false,
      };

    case "REPORTED":
    case "AWAITING_OWNER_CONFIRMATION":
      return {
        key: "REPORTED",
        label: "Paiement déclaré — En attente de validation",
        badgeClass:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        isConfirmed: false,
        isReported: true,
        isPending: false,
      };

    case "PARTIALLY_PAID":
      return {
        key: "PARTIALLY_PAID",
        label: "Paiement partiel",
        badgeClass:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        isConfirmed: false,
        isReported: false,
        isPending: false,
      };

    case "REJECTED":
    case "FAILED":
      return {
        key: "REJECTED",
        label: "Paiement non validé",
        badgeClass:
          "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
        isConfirmed: false,
        isReported: false,
        isPending: false,
      };

    case "PENDING":
    case "UNPAID":
    default:
      return {
        key: "UNPAID",
        label: "Non payé",
        badgeClass:
          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        isConfirmed: false,
        isReported: false,
        isPending: true,
      };
  }
}
