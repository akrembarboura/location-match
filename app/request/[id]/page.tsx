"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Users,
  Home,
  Check,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Phone,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Nouvelle demande", color: "bg-amber-100 text-amber-800 border-amber-200" },
    UNDER_REVIEW: { label: "En cours d'examen", color: "bg-blue-100 text-blue-800 border-blue-200" },
    PROPERTY_PROPOSED: { label: "Logement proposé !", color: "bg-purple-100 text-purple-800 border-purple-200" },
    CLIENT_CONFIRMATION: { label: "En attente de confirmation", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    CONFIRMED: { label: "Réservation confirmée", color: "bg-green-100 text-green-800 border-green-200" },
    COMPLETED: { label: "Séjour terminé", color: "bg-gray-100 text-gray-700 border-gray-200" },
    REJECTED: { label: "Non disponible", color: "bg-rose-100 text-rose-800 border-rose-200" },
    CANCELLED: { label: "Annulée", color: "bg-gray-100 text-gray-500 border-gray-200" },
  };

  const badge = map[status] || { label: status, color: "bg-gray-100 text-gray-700 border-gray-200" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.color}`}>
      {status === "CONFIRMED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {badge.label}
    </span>
  );
}

export default function RequestTrackingPage() {
  const { id } = useParams() as { id: string };
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequestData(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleProposalAction = async (propertyId: string, action: "ACCEPTED" | "REJECTED") => {
    setActionLoading(propertyId);
    setMessage(null);

    try {
      const res = await fetch(`/api/requests/${id}/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setMessage({ text: data.message, type: "success" });
      await fetchRequest();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-muted-foreground">
          Chargement de votre demande...
        </div>
      </PageShell>
    );
  }

  if (!requestData) {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-2xl text-foreground">Demande introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune demande trouvée avec la référence <strong>{id}</strong>.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Retour à l'accueil
          </Link>
        </div>
      </PageShell>
    );
  }

  const proposals = requestData.proposedProperties || [];

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Suivi de demande · {requestData.rentalCategory === "summer" ? "Location d'été" : "Logement étudiant"}
            </span>
            <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
              Référence : {requestData.id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Demandeur : <strong>{requestData.customer?.fullName}</strong> ({requestData.customer?.phone})
            </p>
          </div>
          <StatusBadge status={requestData.status} />
        </div>

        {message && (
          <div
            className={`mt-6 rounded-lg p-4 text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-900 border border-green-200"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main: Proposals & Status */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl text-foreground">
                Logement(s) proposé(s) par l'équipe LOC MAISON
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vérifiez les logements sélectionnés pour vous, et confirmez votre choix pour bloquer la réservation.
              </p>
            </div>

            {proposals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                <Clock className="mx-auto h-10 w-10 text-primary animate-pulse" />
                <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                  Recherche en cours
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Notre équipe sélectionne actuellement les meilleures maisons disponibles à{" "}
                  <strong>{requestData.destination}</strong> pour vos dates ({requestData.checkIn} → {requestData.checkOut || "flexible"}).
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Dès qu'un bien correspond à vos critères, il apparaîtra directement ici et vous recevrez un message WhatsApp.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {proposals.map((p: any) => {
                  const house = p.house;
                  const isPending = p.status === "PENDING_CLIENT";
                  const isAccepted = p.status === "ACCEPTED";
                  const isRejected = p.status === "REJECTED";

                  return (
                    <div
                      key={p.propertyId}
                      className={`overflow-hidden rounded-xl border bg-card shadow-card transition-all ${
                        isAccepted
                          ? "border-green-500 ring-2 ring-green-500/20"
                          : isRejected
                          ? "opacity-60 border-border"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="grid sm:grid-cols-[240px_1fr]">
                        {/* Photo */}
                        <div className="relative aspect-[4/3] sm:aspect-auto bg-muted">
                          {house?.coverImage ? (
                            <img
                              src={house.coverImage}
                              alt={house.title || "Logement proposé"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              Photo non disponible
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-primary">
                                {house?.city || requestData.destination}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium ${
                                  isAccepted
                                    ? "bg-green-100 text-green-800"
                                    : isRejected
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {isAccepted
                                  ? "✓ Proposition acceptée"
                                  : isRejected
                                  ? "Proposition refusée"
                                  : "En attente de votre réponse"}
                              </span>
                            </div>

                            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                              {house?.title || `Logement Réf. ${p.propertyId}`}
                            </h3>

                            {house?.location && (
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" /> {house.location}, {house.city}
                              </p>
                            )}

                            {p.adminMessage && (
                              <div className="mt-3 rounded-lg bg-surface p-3 text-xs text-foreground">
                                <p className="font-semibold text-primary">Message de notre équipe :</p>
                                <p className="mt-0.5 text-muted-foreground">{p.adminMessage}</p>
                              </div>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-foreground">
                              <span className="text-primary font-display text-xl">
                                {p.proposedPrice || house?.pricePerNight} DT{" "}
                                <span className="text-xs text-muted-foreground font-normal">
                                  {requestData.rentalCategory === "summer" ? "/ nuit" : "/ mois"}
                                </span>
                              </span>
                              {house?.bedrooms && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  {house.bedrooms} chambres
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Client Actions */}
                          <div className="mt-5 border-t border-border pt-4">
                            {isPending && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={actionLoading === p.propertyId}
                                  onClick={() => handleProposalAction(p.propertyId, "ACCEPTED")}
                                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                                >
                                  <Check className="h-4 w-4" />
                                  Accepter cette proposition
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading === p.propertyId}
                                  onClick={() => handleProposalAction(p.propertyId, "REJECTED")}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Refuser
                                </button>
                                {house?.slug && (
                                  <Link
                                    href={`/houses/${house.slug}`}
                                    target="_blank"
                                    className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2.5 text-xs text-foreground hover:bg-surface"
                                  >
                                    Voir la fiche complète →
                                  </Link>
                                )}
                              </div>
                            )}

                            {isAccepted && (
                              <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Vous avez accepté cette offre. Notre conseiller va vous contacter pour finaliser le contrat.
                              </div>
                            )}

                            {isRejected && (
                              <p className="text-xs text-muted-foreground">
                                Vous avez refusé ce bien. Nous continuons la recherche.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: Request Summary */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-base font-semibold text-foreground">
                Rappel de vos critères
              </h3>

              <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Destination
                  </span>
                  <span className="font-medium text-foreground">
                    {requestData.destination} {requestData.area ? `(${requestData.area})` : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Période
                  </span>
                  <span className="font-medium text-foreground">
                    {requestData.checkIn} → {requestData.checkOut || "Flexible"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> Personnes
                  </span>
                  <span className="font-medium text-foreground">{requestData.guests}</span>
                </div>

                {requestData.budget && (
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span>Budget max</span>
                    <span className="font-medium text-foreground">
                      {requestData.budget} DT / {requestData.budgetPeriod === "week" ? "semaine" : "mois"}
                    </span>
                  </div>
                )}

                {requestData.propertyType && (
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-primary" /> Type
                    </span>
                    <span className="font-medium text-foreground">{requestData.propertyType}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-lg bg-surface p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-primary" /> Assistance WhatsApp
                </p>
                <p className="mt-1">
                  Une question sur votre demande ? Contactez notre support direct au{" "}
                  <a href="tel:+21690000000" className="text-primary font-medium underline">
                    +216 90 000 000
                  </a>.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
