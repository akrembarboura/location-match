import React from "react";
import { cn } from "@/lib/utils";
import { PropertyStatus } from "@/lib/models";

const STATUS_CONFIG: Record<
  PropertyStatus | string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Brouillon",
    className: "bg-muted text-muted-foreground border-border",
  },
  PENDING_REVIEW: {
    label: "En attente de vérification",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  UNDER_REVIEW: {
    label: "En cours de vérification",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  PUBLISHED: {
    label: "Publié",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  REJECTED: {
    label: "Refusé",
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  ARCHIVED: {
    label: "Archivé",
    className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  },
};

export function PropertyModerationBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

