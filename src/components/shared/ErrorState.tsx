"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données pour le moment. Veuillez réessayer.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-xs",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-5 gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Réessayer
        </Button>
      )}
    </div>
  );
}
