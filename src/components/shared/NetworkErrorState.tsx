"use client";

import React from "react";
import { WifiOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NetworkErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function NetworkErrorState({
  title = "Connexion interrompue",
  message = "Impossible de contacter le serveur. Veuillez vérifier votre connexion internet et réessayer.",
  onRetry,
  className,
}: NetworkErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center shadow-xs",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
        <WifiOff className="h-6 w-6" aria-hidden="true" />
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
          className="mt-5 gap-2 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Réessayer la connexion
        </Button>
      )}
    </div>
  );
}
