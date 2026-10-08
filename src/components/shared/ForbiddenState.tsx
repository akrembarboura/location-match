"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ForbiddenStateProps {
  title?: string;
  message?: string;
  backHref?: string;
  className?: string;
}

export function ForbiddenState({
  title = "Accès refusé",
  message = "Vous ne disposez pas des autorisations nécessaires pour accéder à cette ressource.",
  backHref = "/",
  className,
}: ForbiddenStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-xs",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href={backHref}>Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
