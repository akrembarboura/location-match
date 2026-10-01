"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { PageShell } from "@/components/site/PageShell";



function Success() {
  const searchParams = useSearchParams(); const type = searchParams.get("type");
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-5 font-display text-3xl text-foreground">Demande reçue</h1>
        <p className="mt-3 text-muted-foreground">
          {type === "student"
            ? "Nous contactons les propriétaires près de votre université."
            : "Nous vérifions la disponibilité pour vos dates."}{" "}
          Attendez-vous à un message WhatsApp de notre équipe dans quelques heures.
        </p>
        <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm">
          {["Nous contactons des propriétaires vérifiés", "Nous vous envoyons les meilleures options", "Vous visitez ou appelez, puis confirmez"].map((s, i) => (
            <li key={s} className="flex gap-3 rounded-md border border-border bg-card p-3">
              <span className="font-display text-primary">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark">Suivre mes demandes</Link>
          <Link href="/properties" className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground hover:border-primary">Parcourir les biens</Link>
        </div>
      </div>
    </PageShell>
  );
}

export default function SuccessPage() { return <Suspense fallback={<div>Chargement...</div>}><Success /></Suspense>; }
