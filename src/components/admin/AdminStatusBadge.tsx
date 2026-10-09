import React from "react";
import { cn } from "@/lib/utils";
import { ADMIN_STATUS_CONFIG, StatusBadgeProps } from "@/lib/admin-theme";

export function AdminStatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps) {
  const config = ADMIN_STATUS_CONFIG[status] || {
    label: status,
    className: "bg-surface text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
  };

  const badgeText = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-medium transition-colors",
        config.className,
        className
      )}
    >
      <span>{badgeText}</span>
    </span>
  );
}

