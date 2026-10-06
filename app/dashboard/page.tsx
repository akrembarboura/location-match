"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { Calendar, MapPin, Users, ArrowRight, Loader2, AlertCircle, Inbox } from "lucide-react";

interface CustomerRequest {
  id: string;
  rentalCategory: string;
  destination?: string;
  area?: string;
  propertyType?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  budget?: number | string;
  budgetPeriod?: string;
  status: string;
  createdAt?: string;
  proposedProperties?: any[];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  UNDER_REVIEW: { label: "En cours d'étude", className: "bg-blue-100 text-blue-800" },
  PROPERTY_PROPOSED: { label: "Proposition reçue", className: "bg-purple-100 text-purple-800" },
  CLIENT_CONFIRMATION: { label: "Confirmation client", className: "bg-indigo-100 text-indigo-800" },
  CONFIRMED: { label: "Confirmée", className: "bg-emerald-100 text-emerald-800" },
  COMPLETED: { label: "Clôturée", className: "bg-gray-100 text-gray-800" },
  REJECTED: { label: "Refusée", className: "bg-rose-100 text-rose-800" },
  CANCELLED: { label: "Annulée", className: "bg-gray-100 text-gray-600" },
};

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchRequests() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/requests");
        if (res.status === 401) {
          setError("Veuillez vous connecter pour voir vos demandes.");
          return;
        }
        if (!res.ok) {
          throw new Error("Erreur de chargement");
        }
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } catch {
        setError("Impossible de charger vos demandes. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [user, authLoading]);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="eyebrow">Mon espace</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Mes demandes</h1>

        {authLoading || loading ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Chargement de vos demandes…</p>
          </div>
        ) : error ? (
          <div className="mt-8 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
              {!user && (
                <Link href="/login" className="mt-2 inline-block font-semibold text-primary underline">
                  Se connecter à mon compte
                </Link>
              )}
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <div className="rounded-full bg-surface p-3 text-muted-foreground">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-display text-lg text-foreground">Aucune demande pour le moment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous n'avez pas encore envoyé de demande de logement. Créez votre première demande ci-dessous.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/request/summer"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
              >
                Nouvelle demande d'été
              </Link>
              <Link
                href="/request/student"
                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                Nouvelle demande étudiante
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((r) => {
              const statusCfg = STATUS_LABELS[r.status] || {
                label: r.status,
                className: "bg-gray-100 text-gray-800",
              };
              const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "—";
              const proposalsCount = r.proposedProperties?.length || 0;

              return (
                <div key={r.id} className="rounded-lg border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {r.id} · {r.rentalCategory === "summer" ? "Location d'été" : "Logement étudiant"} · envoyée le {dateStr}
                      </span>
                      {(r as any).propertyId && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Réservation directe
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>

                      {((r as any).payment || (r as any).paymentSummary) && (() => {
                        const payStatus = (r as any).payment?.status || (r as any).paymentSummary?.status || "UNPAID";
                        const isConfirmed = ["CONFIRMED", "VERIFIED", "PAID"].includes(payStatus);
                        const isReported = ["REPORTED", "AWAITING_OWNER_CONFIRMATION"].includes(payStatus);

                        return (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isConfirmed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : isReported
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}>
                            {isConfirmed ? "✓ Paiement confirmé" : isReported ? "🟡 Paiement déclaré" : "Non payé"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-lg text-foreground">
                        {(r as any).selectedPropertyDetails?.title || r.propertyType || "Logement"} — {(r as any).selectedPropertyDetails?.city || r.destination || r.area || "Tunisie"}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {((r as any).selectedPropertyDetails?.city || r.destination || r.area) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {(r as any).selectedPropertyDetails?.city || r.destination} {(r as any).selectedPropertyDetails?.area || r.area ? `(${ (r as any).selectedPropertyDetails?.area || r.area})` : ""}
                          </span>
                        )}
                        {(r.checkIn || r.checkOut) && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {r.checkIn || "—"} au {r.checkOut || "—"}
                          </span>
                        )}
                        {r.guests && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {r.guests} {r.guests > 1 ? "personnes" : "personne"}
                          </span>
                        )}
                        {(r.budget || (r as any).selectedPropertyDetails?.pricing?.price) && (
                          <span className="font-medium text-foreground">
                            Tarif : {r.budget || (r as any).selectedPropertyDetails?.pricing?.price} DT {r.budgetPeriod ? `/${r.budgetPeriod}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      {(r as any).propertyId
                        ? `Demande directe pour "${(r as any).selectedPropertyDetails?.title || (r as any).propertyId}"`
                        : proposalsCount > 0
                        ? `${proposalsCount} proposition(s) de logement disponible(s)`
                        : "Notre équipe recherche les meilleures options pour votre séjour."}
                    </p>
                    <Link
                      href={`/request/${r.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Voir le suivi <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link
            href="/request/summer"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            Nouvelle demande d'été
          </Link>
          <Link
            href="/request/student"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Nouvelle demande étudiante
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
