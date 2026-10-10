"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { AdminStatusBadge } from "@/lib/admin-theme";
import { formatDT } from "@/lib/utils";
import {
  Building2,
  Clock,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Archive,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminProperty {
  id: string;
  slug?: string;
  title: string;
  type?: string;
  propertyType?: string;
  city: string;
  area?: string;
  rentalCategory: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  pricing?: {
    price?: number;
    pricePeriod?: string;
    currency?: string;
  };
  summerPrice?: number;
  studentPrice?: number;
  pricePerNight?: number;
  verified: boolean;
  status: string;
  images?: any[];
  coverImage?: string;
  moderation?: {
    submittedAt?: string;
    rejectionReason?: string;
    reviewedBy?: string;
  };
  createdAt?: string;
  owner?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  } | null;
}

const STATUS_TABS = [
  { key: "ALL", label: "Toutes les annonces" },
  { key: "PENDING_REVIEW", label: "En attente" },
  { key: "UNDER_REVIEW", label: "En examen" },
  { key: "PUBLISHED", label: "Publiées" },
  { key: "REJECTED", label: "Refusées" },
  { key: "ARCHIVED", label: "Archivées" },
] as const;

function AdminPropertiesContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || searchParams.get("ownerId") || "";

  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    underReview: 0,
    published: 0,
    rejected: 0,
    archived: 0,
  });

  // State Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination & Loading
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/admin/properties?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erreur de chargement des biens immobiliers.");
      }
      const data = await res.json();
      setProperties(data.properties || []);
      if (data.counts) {
        setCounts(data.counts);
      }
      if (data.pagination) {
        setTotalCount(data.pagination.total || 0);
        setTotalPages(data.pagination.totalPages || 1);
      } else {
        setTotalCount(data.properties?.length || 0);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || "Impossible de charger les biens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [selectedStatus, searchQuery, currentPage, pageSize]);

  // Client-side category filtering on top of server data
  const filteredProperties = useMemo(() => {
    if (categoryFilter === "ALL") return properties;
    return properties.filter((p) => p.rentalCategory === categoryFilter);
  }, [properties, categoryFilter]);

  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<AdminProperty | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await fetch(`/api/admin/properties/${propertyToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason.trim() || undefined }),
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
      setDeleteReason("");
      await fetchProperties();
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminShell
      title="Biens"
      subtitle="Gérez les annonces, vérifiez les dossiers et suivez leur publication."
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

      {/* Biens & Propriétaires Section Navigation Tabs */}
      <div className="mb-6 flex items-center border-b border-border">
        <Link
          href="/admin/properties"
          className="flex items-center gap-2 border-b-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors"
        >
          <Building2 className="h-4 w-4" /> Logements & Annonces
        </Link>
        <Link
          href="/admin/owners"
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-border hover:text-foreground transition-colors"
        >
          <Users className="h-4 w-4" /> Propriétaires
        </Link>
      </div>

      {/* Metric Summary Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Total Annonces</span>
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-black dark:text-white">{counts.all}</p>
          <span className="text-[0.7rem] text-muted-foreground">Logements enregistrés</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>En attente</span>
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-black dark:text-white">
            {counts.pending}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">À vérifier par la modération</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Publiées (En ligne)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-black dark:text-white">
            {counts.published}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">Visibles sur le site public</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Refusées / Archivées</span>
            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {counts.rejected + counts.archived}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">{counts.rejected} refusée(s) · {counts.archived} archivée(s)</span>
        </div>
      </div>

      {/* Moderation Status Navigation Tabs */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
          {STATUS_TABS.map((tab) => {
            let tabCount = counts.all;
            if (tab.key === "PENDING_REVIEW") tabCount = counts.pending;
            if (tab.key === "UNDER_REVIEW") tabCount = counts.underReview;
            if (tab.key === "PUBLISHED") tabCount = counts.published;
            if (tab.key === "REJECTED") tabCount = counts.rejected;
            if (tab.key === "ARCHIVED") tabCount = counts.archived;

            const isActive = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[0.65rem] font-bold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-surface border border-border text-muted-foreground"
                  )}
                >
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search + Secondary Filters + View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 min-w-[260px] max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par titre, ville, réf ou propriétaire..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-2xs"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none shadow-2xs"
            >
              <option value="ALL">Toutes catégories</option>
              <option value="summer">Vacances (Été)</option>
              <option value="student">Étudiant (Universitaire)</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                title="Réinitialiser les filtres"
              >
                <X className="h-3.5 w-3.5" />
                Effacer
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-surface text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Vue Tableau opérationnel"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-surface text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Vue Grille de cartes"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <AsyncStateContainer
        isLoading={loading}
        loadingText="Chargement des annonces immobilières…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        isEmpty={filteredProperties.length === 0}
        emptyTitle="Aucune annonce trouvée"
        emptyDescription="Aucun bien immobilier ne correspond aux critères de recherche actuels."
        onRetry={fetchProperties}
      >
        {viewMode === "table" ? (
          /* Operational Inventory Data Table */
          <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/80 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Logement & Catégorie</th>
                    <th className="p-3.5">Ville & Quartier</th>
                    <th className="p-3.5">Propriétaire</th>
                    <th className="p-3.5">Prix & Période</th>
                    <th className="p-3.5">Statut Modération</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProperties.map((p) => {
                    const price = p.pricing?.price || p.summerPrice || p.studentPrice || p.pricePerNight || 0;
                    const periodLabel = p.pricing?.pricePeriod === "month"
                      ? "/ mois"
                      : p.pricing?.pricePeriod === "week"
                      ? "/ sem."
                      : p.rentalCategory === "student"
                      ? "/ mois"
                      : "/ nuit";

                    const coverImg =
                      p.coverImage ||
                      (typeof p.images?.[0] === "string"
                        ? p.images[0]
                        : p.images?.[0]?.url) ||
                      "/placeholder-property.jpg";

                    const ownerName = p.owner?.name || "Propriétaire";
                    const submittedDate = p.moderation?.submittedAt || p.createdAt;
                    const formattedDate = submittedDate
                      ? new Date(submittedDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null;

                    return (
                      <tr key={p.id} className="hover:bg-surface/60 transition-colors">
                        {/* Property Title & Thumbnail */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3 max-w-[260px]">
                            <div className="h-10 w-12 rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                              <img
                                src={coverImg}
                                alt={p.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground truncate block text-xs" title={p.title}>
                                {p.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[0.68rem] text-primary font-bold">#{p.id}</span>
                                <span className="text-[0.65rem] font-medium text-muted-foreground px-1.5 py-0.2 rounded bg-surface border border-border/50">
                                  {p.rentalCategory === "summer" ? "Vacances" : "Étudiant"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="p-3.5 text-muted-foreground">
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{p.city}</span>
                          </div>
                          {p.area && <div className="text-[0.7rem] text-muted-foreground pl-4">{p.area}</div>}
                        </td>

                        {/* Owner Contact */}
                        <td className="p-3.5 text-muted-foreground">
                          <div className="font-semibold text-foreground text-xs">{ownerName}</div>
                          {p.owner?.phone && (
                            <div className="text-[0.7rem] font-mono text-emerald-600 dark:text-emerald-400">
                              {p.owner.phone}
                            </div>
                          )}
                        </td>

                        {/* Pricing */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-display font-bold text-foreground text-sm">
                            {formatDT(price)} DT
                          </span>{" "}
                          <span className="text-[0.7rem] font-medium text-muted-foreground">{periodLabel}</span>
                        </td>

                        {/* Moderation Status */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <AdminStatusBadge status={p.status} showDot />
                            {formattedDate && (
                              <div className="text-[0.68rem] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formattedDate}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <Link
                              href={`/admin/properties/${p.id}`}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors shadow-2xs",
                                p.status === "PENDING_REVIEW"
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
                                  : "border-border bg-surface text-foreground hover:border-primary hover:bg-card"
                              )}
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>{p.status === "PENDING_REVIEW" ? "Vérifier" : "Examen"}</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteReason("");
                                setPropertyToDelete(p);
                              }}
                              title="Supprimer le bien"
                              aria-label={`Supprimer le bien ${p.title}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors shadow-2xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only">Supprimer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((p) => {
              const price = p.pricing?.price || p.summerPrice || p.studentPrice || p.pricePerNight || 0;
              const periodLabel = p.pricing?.pricePeriod === "month"
                ? "/ mois"
                : p.pricing?.pricePeriod === "week"
                ? "/ sem."
                : p.rentalCategory === "student"
                ? "/ mois"
                : "/ nuit";

              const coverImg =
                p.coverImage ||
                (typeof p.images?.[0] === "string"
                  ? p.images[0]
                  : p.images?.[0]?.url) ||
                "/placeholder-property.jpg";

              return (
                <div
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all hover:border-primary/50 hover:shadow-xs"
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                    <img
                      src={coverImg}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-2.5 top-2.5 z-10 flex gap-1.5">
                      <AdminStatusBadge status={p.status} showDot />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-mono font-bold text-primary">#{p.id}</span>
                      <span className="font-medium text-foreground">{p.city}</span>
                    </div>

                    <h3 className="font-display text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {p.bedrooms ? <span>{p.bedrooms} ch.</span> : null}
                      {p.bathrooms ? <span>{p.bathrooms} sdb.</span> : null}
                      {p.surface ? <span>{p.surface} m²</span> : null}
                      <span className="capitalize">{p.rentalCategory === "summer" ? "Été" : "Étudiant"}</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 mt-4">
                      <div>
                        <span className="font-display text-base font-bold text-foreground">{formatDT(price)} DT</span>{" "}
                        <span className="text-xs text-muted-foreground">{periodLabel}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary hover:bg-card transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" /> Examen
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteReason("");
                            setPropertyToDelete(p);
                          }}
                          title="Supprimer le bien"
                          aria-label={`Supprimer le bien ${p.title}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors shadow-2xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Server Pagination Controls */}
        {filteredProperties.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <div>
              Affichage de{" "}
              <strong className="text-foreground">
                {Math.min((currentPage - 1) * pageSize + 1, totalCount)}
              </strong>{" "}
              à{" "}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, totalCount)}
              </strong>{" "}
              sur <strong className="text-foreground">{totalCount}</strong> bien(s)
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Par page :</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 transition-colors shadow-2xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Précédent
                </button>
                <span className="font-medium text-foreground px-2">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 transition-colors shadow-2xs"
                >
                  Suivant <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AsyncStateContainer>

      {/* Delete Confirmation Modal for Admin */}
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
                    Supprimer l'annonce (Modération)
                  </h3>
                  <p className="text-xs text-muted-foreground">Action d'administration</p>
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
              <div className="flex items-center justify-between text-muted-foreground pt-1">
                <span>ID : #{propertyToDelete.id}</span>
                <span>Propriétaire : {propertyToDelete.owner?.name || "N/A"}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Confirmez-vous la suppression de cette annonce ? Elle sera retirée du catalogue public.
            </p>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-[0.75rem] text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-0.5">Règles de suppression sécurisée :</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Des réservations actives en cours ou à venir bloqueront la suppression.</li>
                <li>Si des réservations ou paiements historiques existent, l'annonce sera archivée afin de préserver l'intégrité comptable.</li>
                <li>Sans historique, l'annonce et ses images associées seront supprimées définitivement.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-delete-reason" className="text-xs font-semibold text-foreground">
                Motif de la suppression (optionnel) :
              </label>
              <input
                id="admin-delete-reason"
                type="text"
                placeholder="Ex : Annonce dupliquée, demande expresse du propriétaire..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={isDeleting}
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
    </AdminShell>
  );
}

export default function AdminProperties() {
  return (
    <Suspense
      fallback={
        <AdminShell
          title="Biens"
          subtitle="Gérez les annonces, vérifiez les dossiers et suivez leur publication."
        >
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </AdminShell>
      }
    >
      <AdminPropertiesContent />
    </Suspense>
  );
}
