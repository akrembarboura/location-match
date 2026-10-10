"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyModerationBadge } from "@/components/properties/PropertyModerationBadge";
import { LoadingThreeDotsJumping } from "@/components/shared/LoadingThreeDotsJumping";
import { formatDT } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Archive,
  ExternalLink,
  MapPin,
  BedDouble,
  Bath,
  Users,
  Ruler,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Eye,
  History,
  Calendar,
  BarChart3,
  Heart,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import type { PropertyPerformance } from "@/lib/analytics/types";

export default function AdminPropertyReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<{
    property: any;
    moderationEvents: any[];
  } | null>(null);

  const [analyticsData, setAnalyticsData] = useState<PropertyPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Reservation modal state
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveMode, setReserveMode] = useState<"create" | "update">("create");
  const [reservationFrom, setReservationFrom] = useState("");
  const [reservationTo, setReservationTo] = useState("");
  const [reserveError, setReserveError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function fetchDetails() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/properties/${id}`);
      if (!res.ok) {
        throw new Error("Impossible de charger les détails du bien.");
      }
      const json = await res.json();
      setData(json);

      // Fetch property analytics
      try {
        const aRes = await fetch(`/api/admin/properties/${id}/analytics`);
        if (aRes.ok) {
          const aJson = await aRes.json();
          setAnalyticsData(aJson);
        }
      } catch {
        /* Ignore analytics fetch error */
      }
    } catch (err: any) {
      setError(err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (!loading && typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const elem = document.getElementById(hash);
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    }
  }, [loading]);

  async function handleTakeCharge() {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/properties/${id}/review`, { method: "POST" });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Échec de la prise en charge.");
      }
      await fetchDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!confirm("Confirmez-vous la validation et la publication de ce bien sur LOC MAISON ?")) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/properties/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Échec de la publication.");
      }
      await fetchDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmReject() {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectError("Le motif du refus doit comporter au moins 5 caractères explicites.");
      return;
    }

    try {
      setActionLoading(true);
      setRejectError(null);
      const res = await fetch(`/api/admin/properties/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Échec du refus.");
      }

      setShowRejectModal(false);
      setRejectionReason("");
      await fetchDetails();
    } catch (err: any) {
      setRejectError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchive() {
    if (!confirm("Voulez-vous archiver ce bien ? Il ne sera plus visible sur le catalogue.")) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/properties/${id}/archive`, { method: "POST" });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Échec de l'archivage.");
      }
      await fetchDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteProperty() {
    try {
      setActionLoading(true);
      setDeleteError(null);
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de la suppression.");
      }
      router.push("/admin/properties");
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression.");
    } finally {
      setActionLoading(false);
    }
  }

  function openReserveModal(mode: "create" | "update") {
    setReserveMode(mode);
    setReserveError(null);
    if (mode === "update" && data?.property?.reservation?.from && data?.property?.reservation?.to) {
      setReservationFrom(new Date(data.property.reservation.from).toISOString().slice(0, 10));
      setReservationTo(new Date(data.property.reservation.to).toISOString().slice(0, 10));
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      setReservationFrom(today);
      setReservationTo(nextWeek);
    }
    setShowReserveModal(true);
  }

  async function handleConfirmReservation() {
    if (!reservationFrom || !reservationTo) {
      setReserveError("Veuillez renseigner les dates d'arrivée et de départ.");
      return;
    }
    if (new Date(reservationFrom) >= new Date(reservationTo)) {
      setReserveError("La date d'arrivée doit être antérieure à la date de départ.");
      return;
    }

    try {
      setActionLoading(true);
      setReserveError(null);
      const method = reserveMode === "create" ? "POST" : "PATCH";
      const res = await fetch(`/api/admin/properties/${id}/reservation`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: reservationFrom,
          to: reservationTo,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Échec de l'enregistrement de la réservation.");
      }

      setShowReserveModal(false);
      await fetchDetails();
    } catch (err: any) {
      setReserveError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReleaseReservation() {
    if (!confirm("Confirmez-vous la libération de ce bien ? Il redeviendra disponible pour de nouvelles réservations.")) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/properties/${id}/reservation`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Échec de la libération de la réservation.");
      }

      await fetchDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card">
        <LoadingThreeDotsJumping text="Chargement de la fiche annonce…" size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <AdminShell title="Examen de l'annonce" subtitle="Erreur">
        <div className="max-w-2xl">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error || "Bien introuvable."}</p>
          </div>
          <Link
            href="/admin/properties"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste des biens
          </Link>
        </div>
      </AdminShell>
    );
  }

  const { property, moderationEvents = [] } = data;
  const isPending = property.status === "PENDING_REVIEW";
  const isUnderReview = property.status === "UNDER_REVIEW";
  const isPublished = property.status === "PUBLISHED";
  const isRejected = property.status === "REJECTED";
  const isArchived = property.status === "ARCHIVED";

  const price = property.pricing?.price || property.summerPrice || property.studentPrice || 0;
  const period = property.pricing?.pricePeriod === "month" ? "mois" : "semaine";

  const effectiveAnalytics: PropertyPerformance = analyticsData || {
    propertyId: id,
    title: property?.title || "",
    city: property?.city || "",
    views: 0,
    favorites: 0,
    requests: property?.requestCount ?? 0,
    proposals: 0,
    acceptedProposals: 0,
    reservations: property?.reservationCount ?? 0,
    conversionRates: {
      viewToRequest: 0,
      requestToProposal: 0,
      proposalToReservation: 0,
      viewToReservation: 0,
    },
  };

  return (
    <AdminShell
      title={`Examen du bien — ${property.title}`}
      subtitle={`Réf: ${property.id} · Déposé par ${property.owner?.name || "Propriétaire"}`}
    >
      <div className="space-y-6">
        {/* Top bar with back and status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la liste des biens
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Statut actuel :</span>
            <PropertyModerationBadge status={property.status} />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Actions de modération
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPending && "Cette annonce attend d'être prise en charge ou validée."}
                {isUnderReview && "L'annonce est en cours d'examen par l'administration."}
                {isPublished && "Cette annonce est validée et active sur le catalogue public."}
                {isRejected && "Cette annonce a été refusée. Le propriétaire a été notifié."}
                {isArchived && "Cette annonce est actuellement archivée."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPending && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleTakeCharge}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface/80 transition-colors shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Prendre en charge l'examen
                </button>
              )}

              {(isPending || isUnderReview || isRejected || isArchived) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valider et publier le bien
                </button>
              )}

              {(isPending || isUnderReview) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setRejectError(null);
                    setShowRejectModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Refuser avec motif
                </button>
              )}

              {isPublished && (
                <>
                  <Link
                    href={`/houses/${property.slug || property.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface/80 transition-colors"
                  >
                    Voir sur le site public
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleArchive}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archiver le bien
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setDeleteError(null);
                  setDeleteReason("");
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors shadow-2xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer le bien
              </button>
            </div>
          </div>

          {isRejected && property.moderation?.rejectionReason && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Motif de refus enregistré : </span>
                <span>{property.moderation.rejectionReason}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main 2-Column Inspection Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 Cols): Photos & Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos Inspection */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Photos du logement ({property.images?.length || 0})
                </h3>
                <span className="text-xs text-muted-foreground">
                  Photo {activePhotoIdx + 1} sur {property.images?.length || 1}
                </span>
              </div>

              {property.images && property.images.length > 0 ? (
                <div className="space-y-3">
                  {/* Main Large Inspection Photo */}
                  <div className="relative aspect-16/9 overflow-hidden rounded-lg border border-border bg-surface">
                    <img
                      src={property.images[activePhotoIdx]?.url}
                      alt={property.images[activePhotoIdx]?.alt || property.title}
                      className="h-full w-full object-contain bg-black/5"
                    />
                    <a
                      href={property.images[activePhotoIdx]?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 rounded bg-background/85 px-2 py-1 text-xs font-medium text-foreground backdrop-blur hover:bg-background flex items-center gap-1 shadow-xs"
                    >
                      Voir plein format
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {property.images.map((img: any, idx: number) => (
                      <button
                        key={img.id || img.url || idx}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`relative aspect-4/3 w-20 shrink-0 overflow-hidden rounded-md border transition-all ${
                          activePhotoIdx === idx
                            ? "border-primary ring-2 ring-primary/20 scale-95"
                            : "border-border opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-xs text-muted-foreground">
                  Aucune photo disponible pour ce bien.
                </div>
              )}
            </div>

            {/* Description & Property Details */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
              <h3 className="font-display text-base font-semibold text-foreground">
                Description & Caractéristiques
              </h3>

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
                  <span>{property.capacity?.bathrooms || 1} SDB</span>
                </div>
                {property.capacity?.surface && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span>{property.capacity.surface} m²</span>
                  </div>
                )}
              </div>

              {property.description && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Texte de l'annonce
                  </h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed bg-surface/50 p-3 rounded-lg border border-border">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Équipements déclarés
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {property.amenities.map((item: string) => (
                      <span
                        key={item}
                        className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs text-foreground font-medium"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Owner Info, Pricing, Moderation History */}
          <div className="space-y-6">
            {/* Owner Contact Card */}
            <div id="owner" className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3 scroll-mt-6">
              <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Propriétaire & Dossier Client
              </h3>

              {property.owner ? (
                <div className="space-y-2 pt-1 text-sm">
                  <p className="font-semibold text-foreground">{property.owner.name}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <a
                      href={`tel:${property.owner.phone}`}
                      className="hover:underline text-foreground"
                    >
                      {property.owner.phone}
                    </a>
                  </p>
                  {property.owner.email && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <a
                        href={`mailto:${property.owner.email}`}
                        className="hover:underline text-foreground truncate"
                      >
                        {property.owner.email}
                      </a>
                    </p>
                  )}
                  <p className="font-mono text-[0.7rem] text-muted-foreground pt-1 border-t border-border">
                    ID Propriétaire: {property.ownerId}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Identifiant propriétaire : {property.ownerId}
                </p>
              )}
            </div>

            {/* Financial & Location Summary Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
              <h3 className="font-display text-base font-semibold text-foreground">
                Tarif & Localisation
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Loyer demandé :</span>
                  <span className="font-semibold text-foreground text-sm">
                    {price > 0 ? `${formatDT(price)} DT / ${period}` : "Non spécifié"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Catégorie :</span>
                  <span className="font-medium text-foreground">
                    {property.rentalCategory === "summer" ? "Location d'été" : "Logement étudiant"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Type de bien :</span>
                  <span className="font-medium text-foreground">{property.type}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Ville & Quartier :</span>
                  <span className="font-medium text-foreground">
                    {property.city} · {property.area}
                  </span>
                </div>

                {property.address && (
                  <div className="py-1">
                    <span className="text-muted-foreground">Adresse :</span>
                    <p className="font-medium text-foreground mt-0.5">{property.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Disponibilité, Réservation & Performance Section Anchor */}
            <div id="analytics" className="space-y-6 scroll-mt-6">
              {/* Disponibilité & Réservation Card */}
              <div id="reservation" className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Disponibilité & Statut Règlement
                  </h3>
                  {property.availabilityStatus === "RESERVED" ? (
                    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Réservée
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Disponible
                    </span>
                  )}
                </div>

                {property.availabilityStatus === "RESERVED" ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-surface p-3 text-xs space-y-1 border border-border">
                      <p className="text-muted-foreground">Période réservée :</p>
                      <p className="font-semibold text-foreground text-sm">
                        {property.reservation?.from && property.reservation?.to
                          ? `Du ${new Date(property.reservation.from).toLocaleDateString("fr-FR")} au ${new Date(property.reservation.to).toLocaleDateString("fr-FR")}`
                          : "Dates non définies"}
                      </p>
                      {property.reservation?.updatedAt && (
                        <p className="text-[0.7rem] text-muted-foreground pt-1">
                          Dernière mise à jour : {new Date(property.reservation.updatedAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => openReserveModal("update")}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Modifier les dates
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleReleaseReservation}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Libérer le bien
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Le bien est actuellement ouvert à la location. Vous pouvez le marquer comme réservé avec une période définie.
                    </p>
                    {isPublished ? (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => openReserveModal("create")}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Marquer comme réservé
                      </button>
                    ) : (
                      <p className="text-[0.75rem] text-muted-foreground italic">
                        Seul un bien publié peut faire l'objet d'une réservation.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Performance & Analytics Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Performance & Statistiques
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">En direct</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-surface/50 border border-border p-2.5">
                    <p className="text-muted-foreground text-[11px]">Vues de la fiche</p>
                    <p className="font-display text-lg font-bold text-foreground mt-0.5">{effectiveAnalytics.views}</p>
                  </div>
                  <div className="rounded-lg bg-surface/50 border border-border p-2.5">
                    <p className="text-muted-foreground text-[11px]">Favoris</p>
                    <p className="font-display text-lg font-bold text-foreground mt-0.5">{effectiveAnalytics.favorites}</p>
                  </div>
                  <div className="rounded-lg bg-surface/50 border border-border p-2.5">
                    <p className="text-muted-foreground text-[11px]">Demandes générées</p>
                    <p className="font-display text-lg font-bold text-primary mt-0.5">{effectiveAnalytics.requests}</p>
                  </div>
                  <div className="rounded-lg bg-surface/50 border border-border p-2.5">
                    <p className="text-muted-foreground text-[11px]">Propositions reçues</p>
                    <p className="font-display text-lg font-bold text-foreground mt-0.5">{effectiveAnalytics.proposals}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Taux Vue → Demande :</span>
                    <span className="font-mono font-semibold text-foreground">{effectiveAnalytics.conversionRates.viewToRequest}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Taux Demande → Proposition :</span>
                    <span className="font-mono font-semibold text-foreground">{effectiveAnalytics.conversionRates.requestToProposal}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Taux Vue → Réservation :</span>
                    <span className="font-mono font-semibold text-primary">{effectiveAnalytics.conversionRates.viewToReservation}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Moderation History Timeline */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
              <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Historique de modération
              </h3>

              {moderationEvents.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {moderationEvents.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="border-l-2 border-border pl-3 text-xs space-y-0.5"
                    >
                      <p className="font-semibold text-foreground">
                        {evt.action === "SUBMITTED" && "Soumission"}
                        {evt.action === "UNDER_REVIEW" && "Prise en charge"}
                        {evt.action === "APPROVED" && "Validation & Publication"}
                        {evt.action === "REJECTED" && "Refus"}
                        {evt.action === "ARCHIVED" && "Archivage"}
                        {evt.action === "RESERVED" && "Réservation"}
                        {evt.action === "RELEASED" && "Libération"}
                      </p>
                      {evt.reason && (
                        <p className="text-muted-foreground italic">"{evt.reason}"</p>
                      )}
                      <p className="text-[0.7rem] text-muted-foreground">
                        {evt.createdAt ? new Date(evt.createdAt).toLocaleString("fr-FR") : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucun événement enregistré pour le moment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-destructive">
              <XCircle className="h-5 w-5" />
              <h3 className="font-display text-lg font-bold">Refuser la publication</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Indiquez clairement au propriétaire la raison du refus (ex: photos floues, tarif non conforme, description incomplète). Ce message lui sera directement affiché pour qu'il puisse corriger son annonce.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Motif du refus (visible par le propriétaire) *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Ex : Certaines photos ne permettent pas de vérifier correctement l'état du logement. Merci d'ajouter des photos claires du salon et de la salle d'eau."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
              />
            </div>

            {rejectError && (
              <p className="text-xs font-medium text-destructive">{rejectError}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface/80 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-xs"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold">
                {reserveMode === "create" ? "Marquer comme réservé" : "Modifier les dates de réservation"}
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Définissez la plage de dates pendant laquelle ce bien est loué ou indisponible. Ces dates seront affichées sur la fiche publique et le bien ne sera pas proposé pour cette période.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Date d'arrivée (check-in) *
                </label>
                <input
                  type="date"
                  required
                  value={reservationFrom}
                  onChange={(e) => setReservationFrom(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Date de départ (check-out) *
                </label>
                <input
                  type="date"
                  required
                  value={reservationTo}
                  onChange={(e) => setReservationTo(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {reserveError && (
              <p className="text-xs font-medium text-destructive">{reserveError}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowReserveModal(false)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface/80 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReservation}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {reserveMode === "create" ? "Enregistrer la réservation" : "Mettre à jour"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2.5 text-destructive">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Supprimer l'annonce (Modération)
                  </h3>
                  <p className="text-xs text-muted-foreground">Action d'administration irréversible</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!actionLoading) setShowDeleteModal(false);
                }}
                disabled={actionLoading}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-lg bg-surface/80 p-3 border border-border/60 text-xs space-y-1">
              <p className="font-semibold text-foreground line-clamp-1">{data?.property?.title}</p>
              <div className="flex items-center justify-between text-muted-foreground pt-1">
                <span>ID : #{data?.property?.id}</span>
                <span>Propriétaire : {data?.property?.owner?.name || "N/A"}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Confirmez-vous la suppression de cette annonce ? Elle ne sera plus consultable ni visible sur le catalogue public.
            </p>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-[0.75rem] text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-0.5">Règles de suppression sécurisée :</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Des réservations actives en cours ou à venir bloqueront la suppression.</li>
                <li>Si des réservations ou des flux comptables existent, l'annonce sera archivée afin de protéger l'intégrité financière.</li>
                <li>Sans historique, l'annonce et ses photos spécifiques seront supprimées définitivement.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-detail-delete-reason" className="text-xs font-semibold text-foreground">
                Motif de la suppression (optionnel) :
              </label>
              <input
                id="admin-detail-delete-reason"
                type="text"
                placeholder="Ex : Annonce frauduleuse, doublon, résiliation..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={actionLoading}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
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
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface/80 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteProperty}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-xs"
              >
                {actionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{actionLoading ? "Suppression…" : "Confirmer la suppression"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

