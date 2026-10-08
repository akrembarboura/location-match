"use client";

import React from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UnauthorizedStateProps {
  title?: string;
  message?: string;
  redirectUrl?: string;
  className?: string;
}

export function UnauthorizedState({
  title = "Connexion requise",
  message = "Vous devez vous connecter à votre compte pour accéder à cette page.",
  redirectUrl = "/login",
  className,
}: UnauthorizedStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-xs",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <LogIn className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
      <Button asChild variant="default" className="mt-5 shadow-xs">
        <Link href={redirectUrl}>Se connecter</Link>
      </Button>
    </div>
  );
}
