"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { PropertyModerationBadge } from "@/components/properties/PropertyModerationBadge";
import { formatDT } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Send,
  ExternalLink,
  MapPin,
  BedDouble,
  Bath,
  Users,
  Ruler,
  TrendingUp,
} from "lucide-react";
import type { OwnerPropertyAnalytics } from "@/lib/analytics/types";

export default function OwnerPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [property, setProperty] = useState<any | null>(null);
  const [ownerAnalytics, setOwnerAnalytics] = useState<OwnerPropertyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/owner/properties/${id}`);
        if (!res.ok) {
          throw new Error("Impossible de charger les informations du bien.");
        }
        const data = await res.json();
        setProperty(data);

        // Fetch owner analytics
        try {
          const aRes = await fetch(`/api/owner/properties/${id}/analytics`);
          if (aRes.ok) {
            const aJson = await aRes.json();
            setOwnerAnalytics(aJson);
          }
        } catch {
          /* Ignore analytics failure */
        }
      } catch (err: any) {
        setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  async function handleDirectSubmit() {
    if (!confirm("Voulez-vous soumettre ce bien à la vérification de l'équipe LOC MAISON ?")) {
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/owner/properties/${id}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la soumission.");
      }
      setProperty(data.property);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (error || !property) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl py-12 px-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error || "Bien introuvable."}</p>
          </div>
          <Link
            href="/owner"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à mes biens
          </Link>
        </div>
      </PageShell>
    );
  }

  const isDraft = property.status === "DRAFT";
  const isPending = property.status === "PENDING_REVIEW";
  const isUnderReview = property.status === "UNDER_REVIEW";
  const isPublished = property.status === "PUBLISHED";
  const isRejected = property.status === "REJECTED";

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/owner"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à mes biens
          </Link>

          <div className="flex items-center gap-2">
            <PropertyModerationBadge status={property.status} />

            {(isDraft || isRejected) && (
              <Link
                href={`/owner/properties/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                Modifier
              </Link>
            )}

            {isDraft && (
              <button
                type="button"
                onClick={handleDirectSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Soumettre pour vérification
              </button>
            )}
          </div>
        </div>

        {/* Moderation Status Notice */}
        {isRejected && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-base">Votre annonce a été refusée</p>
                <div className="rounded-lg bg-card/80 p-3 border border-destructive/20 text-foreground text-sm">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Motif communiqué par l'administrateur :
                  </p>
                  <p className="font-medium">{property.moderation?.rejectionReason || "Critères de qualité non remplis."}</p>
                </div>
                <p className="text-xs text-foreground/80">
                  Vous pouvez corriger les points signalés ci-dessus et resoumettre votre annonce pour vérification.
                </p>
                <div className="pt-1">
                  <Link
                    href={`/owner/properties/${id}/edit`}
                    className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Corriger et resoumettre mon annonce
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-sm">Annonce en attente de vérification</p>
                <p className="text-xs mt-0.5 text-amber-700/90 dark:text-amber-400/90">
                  Votre annonce a bien été transmise à notre équipe d'inspection. Vous serez notifié dès sa validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {isUnderReview && (
          <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-800 dark:text-blue-300">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-semibold text-sm">Annonce en cours d'examen</p>
                <p className="text-xs mt-0.5 text-blue-700/90 dark:text-blue-400/90">
                  Un administrateur vérifie actuellement la conformité de votre annonce et des photos.
                </p>
              </div>
            </div>
          </div>
        )}

        {isPublished && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-sm">Votre bien est en ligne</p>
                  <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90">
                    Disponibilité :{" "}
                    {property.availabilityStatus === "RESERVED" ? (
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        Réservé {property.reservation?.from && property.reservation?.to && `du ${new Date(property.reservation.from).toLocaleDateString("fr-FR")} au ${new Date(property.reservation.to).toLocaleDateString("fr-FR")}`}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Disponible</span>
                    )}
                  </p>
                </div>
              </div>
              <Link
                href={`/houses/${property.slug || property.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Voir sur le site
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Owner Property Performance Analytics */}
        {ownerAnalytics && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Statistiques de votre annonce
              </h3>
              <span className="text-[11px] text-muted-foreground font-mono">Temps réel</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-surface/50 border border-border p-3">
                <p className="text-muted-foreground text-[11px]">Vues de l&apos;annonce</p>
                <p className="font-display text-xl font-bold text-foreground mt-0.5">{ownerAnalytics.views}</p>
              </div>
              <div className="rounded-lg bg-surface/50 border border-border p-3">
                <p className="text-muted-foreground text-[11px]">Enregistrements favoris</p>
                <p className="font-display text-xl font-bold text-foreground mt-0.5">{ownerAnalytics.favorites}</p>
              </div>
              <div className="rounded-lg bg-surface/50 border border-border p-3">
                <p className="text-muted-foreground text-[11px]">Demandes reçues</p>
                <p className="font-display text-xl font-bold text-primary mt-0.5">{ownerAnalytics.requests}</p>
              </div>
              <div className="rounded-lg bg-surface/50 border border-border p-3">
                <p className="text-muted-foreground text-[11px]">Réservations conclues</p>
                <p className="font-display text-xl font-bold text-foreground mt-0.5">{ownerAnalytics.reservations}</p>
              </div>
            </div>
          </div>
        )}

        {/* Property Overview Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              <span>{property.rentalCategory === "summer" ? "Location d'été" : "Logement étudiant"}</span>
              <span>·</span>
              <span>{property.propertyType}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {property.title}
            </h1>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>
                {property.city} {property.area ? `· ${property.area}` : ""}
                {property.address ? ` (${property.address})` : ""}
              </span>
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="flex items-baseline gap-2 rounded-lg bg-surface/70 p-4 border border-border">
            <span className="font-display text-2xl font-bold text-foreground">
              {formatDT(property.pricing?.price || 0)} DT
            </span>
            <span className="text-sm text-muted-foreground">
              / {property.pricing?.pricePeriod === "month" ? "mois" : property.pricing?.pricePeriod === "night" ? "nuit" : "semaine"}
            </span>
          </div>

          {/* Capacity Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 py-3 border-y border-border text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{property.capacity?.guests || 1} voyageur{(property.capacity?.guests || 1) > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <span>{property.capacity?.bedrooms || 1} chambre{(property.capacity?.bedrooms || 1) > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{property.capacity?.bathrooms || 1} salle{(property.capacity?.bathrooms || 1) > 1 ? "s" : ""} de bain</span>
            </div>
            {property.capacity?.surface && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span>{property.capacity.surface} m²</span>
              </div>
            )}
          </div>

          {/* Photos Grid */}
          <div>
            <h2 className="font-display text-base font-semibold text-foreground mb-3">
              Photos ({property.images?.length || 0})
            </h2>
            {property.images && property.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {property.images.map((img: any, i: number) => (
                  <div
                    key={img.id || img.url || i}
                    className="relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-surface"
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `Photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                        Principale
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Aucune photo enregistrée.</p>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <h2 className="font-display text-base font-semibold text-foreground mb-2">
                Description
              </h2>
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h2 className="font-display text-base font-semibold text-foreground mb-3">
                Équipements
              </h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((item: string) => (
                  <span
                    key={item}
                    className="rounded-full bg-surface border border-border px-3 py-1 text-xs text-foreground font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

