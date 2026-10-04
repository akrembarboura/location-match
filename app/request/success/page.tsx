"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileText, ArrowRight, MessageSquare, Clock } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

function SuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const ref = searchParams.get("ref");
  const name = searchParams.get("name");
  const dest = searchParams.get("dest");
  const prop = searchParams.get("prop");

  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success animate-in zoom-in-75 duration-300" />
        
        <h1 className="mt-5 font-display text-3xl text-foreground sm:text-4xl">
          {prop ? "Demande de réservation reçue !" : "Demande enregistrée !"}
        </h1>

        {ref && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-sm">
            <FileText className="h-4 w-4 text-primary" />
            Référence : <span className="font-mono font-bold text-primary">{ref}</span>
          </div>
        )}

        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Merci {name ? <strong>{name}</strong> : ""} ! Votre demande pour{" "}
          {prop ? <strong>{prop}</strong> : dest ? <strong>{dest}</strong> : "votre séjour"}
          {prop && dest ? ` à ${dest}` : ""} a bien été transmise à notre équipe.
        </p>

        {/* Workflow Steps Card */}
        <div className="mx-auto mt-8 rounded-xl border border-border bg-card p-6 text-left shadow-card">
          <h2 className="flex items-center gap-2 font-display text-base text-foreground">
            <Clock className="h-4 w-4 text-primary" /> Prochaines étapes
          </h2>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                1
              </span>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Vérification de la disponibilité :</strong>{" "}
                {prop
                  ? `Notre équipe contacte le propriétaire pour valider vos dates.`
                  : `Notre équipe vérifie la disponibilité auprès des propriétaires à ${dest || "destination"}.`}
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                2
              </span>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Contact & Confirmation :</strong> Vous recevrez un message WhatsApp / appel dès la confirmation du propriétaire.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                3
              </span>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Finalisation :</strong> Votre logement est réservé et nous préparons votre accueil.
              </p>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          {ref && (
            <Link
              href={`/request/${ref}`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
            >
              Suivre ma demande & voir les propositions
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/houses"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-surface"
          >
            Explorer les maisons disponibles
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted-foreground">Chargement...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
