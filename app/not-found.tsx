"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-4 py-20 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Logo compact className="scale-110" />

        <h1 className="mt-12 font-display text-8xl font-bold tracking-tighter text-foreground/90 sm:text-9xl">
          404
        </h1>

        <div className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Cette page n'existe pas.
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            La page que vous recherchez semble avoir changé d'adresse ou n'est plus disponible.
          </p>
        </div>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-dark"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/houses"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-8 text-sm font-medium text-foreground transition-all hover:bg-sand"
          >
            Explorer les locations
          </Link>
        </div>
      </div>
    </div>
  );
}
