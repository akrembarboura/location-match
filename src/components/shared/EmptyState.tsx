"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 sm:p-12 text-center shadow-xs transition-all",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary shadow-xs">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild variant="default" className="shadow-xs">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction ? (
            <Button onClick={onAction} variant="default" className="shadow-xs">
              {actionLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
