"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { PropertyModerationBadge } from "@/components/properties/PropertyModerationBadge";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { formatDT } from "@/lib/utils";
import {
  Building2,
  PlusCircle,
  Eye,
  Edit,
  CalendarDays,
  Search,
  Send,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
} from "lucide-react";

const STATUS_TABS = [
  { value: "ALL", label: "Tous" },
  { value: "PUBLISHED", label: "Publiées" },
  { value: "PENDING_REVIEW", label: "En examen" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "REJECTED", label: "Refusées" },
  { value: "ARCHIVED", label: "Archivées" },
];

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/owner/properties");
      if (!res.ok) {
        throw new Error("Impossible de charger la liste de vos biens.");
      }
      const data = await res.json();
      setProperties(data || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des annonces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleResubmit = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Voulez-vous soumettre ce bien à la vérification de l'équipe LOC MAISON ?")) {
      return;
    }
    try {
      setSubmittingId(id);
      const res = await fetch(`/api/owner/properties/${id}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la soumission.");
      }
      await fetchProperties();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await fetch(`/api/owner/properties/${propertyToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer ce bien.");
      }

      setFeedbackMessage({
        type: "success",
        text: data.message || "Annonce supprimée avec succès.",
      });

      setPropertyToDelete(null);
      await fetchProperties();
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const title = property.title || "";
    const city = property.city || property.location?.city || "";
    const area = property.area || property.location?.area || "";
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusTab === "ALL") return matchesSearch;
    if (statusTab === "PENDING_REVIEW") {
      return matchesSearch && (property.status === "PENDING_REVIEW" || property.status === "UNDER_REVIEW");
    }
    return matchesSearch && property.status === statusTab;
  });

  return (
    <OwnerShell
      title="Mes biens"
      subtitle="Gérez les détails, tarifs, statuts et disponibilités de vos logements"
    >
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="rounded p-1 hover:bg-emerald-500/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {/* Search & Filter Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par titre, ville ou quartier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground focus:border-primary focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === "ALL"
                ? properties.length
                : tab.value === "PENDING_REVIEW"
                ? properties.filter((p) => p.status === "PENDING_REVIEW" || p.status === "UNDER_REVIEW").length
                : properties.filter((p) => p.status === tab.value).length;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusTab(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusTab === tab.value
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}

          <Link
            href="/owner/list-property"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs ml-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter une annonce
          </Link>
        </div>
      </div>

      <AsyncStateContainer
        isLoading={loading}
        loadingText="Chargement de vos annonces en cours…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        isEmpty={filteredProperties.length === 0}
        emptyTitle={
          properties.length === 0
            ? "Vous n'avez pas encore d'annonce enregistrée"
            : "Aucun bien ne correspond à vos critères de recherche"
        }
        emptyDescription={
          properties.length === 0
            ? "Publiez votre maison, appartement ou villa pour commencer à recevoir des demandes sur LOC MAISON."
            : "Essayez de modifier votre filtre de statut ou votre recherche par mot-clé."
        }
        onRetry={fetchProperties}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const cover =
              property.images?.[0]?.url ||
              (typeof property.images?.[0] === "string" ? property.images[0] : null) ||
              property.coverImage ||
              "/placeholder-property.jpg";

            const isPublished = property.status === "PUBLISHED" || property.isPublished;
            const isRented = property.availabilityStatus === "RESERVED";
            const isDraft = property.status === "DRAFT";

            const displayCity =
              property.city || property.location?.city || "Emplacement non spécifié";
            const displayPrice =
              property.pricing?.price ||
              property.pricePerNight ||
              property.summerPrice ||
              property.studentPrice ||
              0;

            return (
              <div
                key={property.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition-all hover:shadow-card flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-surface">
                    <img
                      src={cover}
                      alt={property.title || "Bien immobilier"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                      <PropertyModerationBadge status={property.status} />
                      <span
                        className={`rounded-md px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-xs backdrop-blur-xs ${
                          isRented
                            ? "bg-rose-600"
                            : isPublished
                            ? "bg-emerald-600"
                            : "bg-amber-600"
                        }`}
                      >
                        {isRented ? "● Louée" : isPublished ? "✓ Disponible" : "⏳ En attente"}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {property.rentalCategory === "summer"
                          ? "Location d'été"
                          : property.rentalCategory === "student"
                          ? "Logement étudiant"
                          : property.propertyType || "Logement"}
                      </span>
                      <span>{displayCity}</span>
                    </div>

                    <h3 className="font-display text-base font-bold text-foreground line-clamp-1">
                      {property.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className="font-bold text-foreground text-sm">
                        {formatDT(displayPrice)} DT
                      </span>
                      <span>
                        / {property.pricing?.pricePeriod === "month" ? "mois" : "nuit"}
                      </span>
                      <span>•</span>
                      <span>{property.capacity?.guests || property.guests || 1} pers.</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 pt-0 border-t border-border mt-3 flex items-center justify-between gap-2">
                  <Link
                    href={`/owner/properties/${property.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Fiche
                  </Link>

                  <div className="flex items-center gap-2">
                    {isDraft && (
                      <button
                        type="button"
                        onClick={(e) => handleResubmit(e, property.id)}
                        disabled={submittingId === property.id}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-2xs"
                      >
                        {submittingId === property.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Soumettre
                      </button>
                    )}

                    <Link
                      href={`/owner/properties/${property.id}/availability`}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface/80 transition-colors"
                    >
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      Calendrier
                    </Link>

                    <Link
                      href={`/owner/properties/${property.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Modifier
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPropertyToDelete(property);
                      }}
                      title="Supprimer l'annonce"
                      aria-label={`Supprimer l'annonce ${property.title}`}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AsyncStateContainer>

      {/* Delete Confirmation Modal */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2.5 text-destructive">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Supprimer l'annonce
                  </h3>
                  <p className="text-xs text-muted-foreground">Confirmation requise</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setPropertyToDelete(null);
                }}
                disabled={isDeleting}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-lg bg-surface/80 p-3 border border-border/60 text-xs space-y-1">
              <p className="font-semibold text-foreground line-clamp-1">{propertyToDelete.title}</p>
              <p className="text-muted-foreground">ID : #{propertyToDelete.id}</p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Êtes-vous sûr de vouloir supprimer cette annonce ? Elle ne sera plus visible publiquement sur LOC MAISON.
            </p>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-[0.75rem] text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-0.5">Conservation comptable & historique :</p>
              <p>
                Si cette annonce possède des réservations passées ou des opérations financières associées, elle sera désactivée et archivée afin de préserver l'intégrité comptable.
              </p>
            </div>

            {deleteError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface/80 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteProperty}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-xs"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{isDeleting ? "Suppression…" : "Confirmer la suppression"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}
