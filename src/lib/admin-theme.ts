export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  showDot?: boolean;
}

export const ADMIN_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dotColor: string }
> = {
  // Requests & Property Statuses
  PENDING: {
    label: "Nouvelle demande",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  PENDING_REVIEW: {
    label: "En attente",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  UNDER_REVIEW: {
    label: "En cours",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  PROPERTY_PROPOSED: {
    label: "Offre envoyée",
    className: "bg-primary-soft text-primary border-primary/20",
    dotColor: "bg-primary",
  },
  CLIENT_CONFIRMATION: {
    label: "En confirmation",
    className: "bg-primary-soft text-primary border-primary/20",
    dotColor: "bg-primary",
  },
  CONFIRMED: {
    label: "Confirmée",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  COMPLETED: {
    label: "Terminée",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  PUBLISHED: {
    label: "Publié",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  REJECTED: {
    label: "Refusé",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dotColor: "bg-rose-500",
  },
  CANCELLED: {
    label: "Annulée",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dotColor: "bg-rose-500",
  },
  DRAFT: {
    label: "Brouillon",
    className: "bg-surface text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
  },
  ARCHIVED: {
    label: "Archivé",
    className: "bg-surface text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
  },
  PAID: {
    label: "Payé",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  UNPAID: {
    label: "Non payé",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  REPORTED: {
    label: "Déclaré",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  REFUNDED: {
    label: "Remboursé",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dotColor: "bg-rose-500",
  },
  ACTIVE: {
    label: "Actif",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  DIRECT: {
    label: "Réservation directe",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  GENERAL: {
    label: "Recherche libre",
    className: "bg-surface text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
  },
};

export { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

