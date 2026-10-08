"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface SkeletonGridProps {
  count?: number;
  columns?: string;
  className?: string;
}

export function SkeletonGrid({
  count = 6,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  className,
}: SkeletonGridProps) {
  return (
    <div className={cn("grid gap-5", columns, className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs"
        >
          <Skeleton className="aspect-4/3 w-full rounded-lg" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/50">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
