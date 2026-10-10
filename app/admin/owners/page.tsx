"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  XCircle,
  Ban,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminOwner {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  phone: string;
  avatar?: string;
  status: string;
  verificationStatus: string;
  createdAt?: string;
  since?: string;
  area?: string;
  totalProperties: number;
  publishedProperties: number;
  pendingReviewProperties: number;
  draftProperties: number;
  rejectedProperties: number;
}

const ACCOUNT_STATUS_OPTIONS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "ACTIVE", label: "Actif" },
  { value: "PENDING", label: "En attente" },
  { value: "REJECTED", label: "Refusé" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "DISABLED", label: "Désactivé" },
];

const PORTFOLIO_OPTIONS = [
  { value: "ALL", label: "Tous les portefeuilles" },
  { value: "WITH_PUBLISHED", label: "Avec biens publiés" },
  { value: "WITH_PENDING", label: "Avec biens en examen" },
  { value: "NO_PUBLISHED", label: "Sans bien publié" },
  { value: "NO_PROPERTIES", label: "Sans aucun bien" },
];

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<AdminOwner[]>([]);
  const [metrics, setMetrics] = useState({
    totalOwners: 0,
    publishedProperties: 0,
    pendingVerification: 0,
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [portfolioFilter, setPortfolioFilter] = useState("ALL");

  // Pagination & Loading State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Owner Modal State
  const [selectedOwner, setSelectedOwner] = useState<AdminOwner | null>(null);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (portfolioFilter !== "ALL") params.set("portfolio", portfolioFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/admin/owners?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erreur de chargement de la liste des propriétaires.");
      }
      const data = await res.json();
      setOwners(data.owners || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
      if (data.pagination) {
        setTotalCount(data.pagination.total || 0);
        setTotalPages(data.pagination.totalPages || 1);
      } else {
        setTotalCount(data.owners?.length || 0);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || "Impossible de charger les propriétaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, [searchQuery, statusFilter, portfolioFilter, currentPage, pageSize]);

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "ALL" || portfolioFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPortfolioFilter("ALL");
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="h-3 w-3" /> Actif
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Clock className="h-3 w-3" /> En attente
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <XCircle className="h-3 w-3" /> Refusé
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
            <Ban className="h-3 w-3" /> Suspendu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminShell
      title="Propriétaires"
      subtitle="Gérez les propriétaires et leurs biens"
    >
      {/* Biens & Propriétaires Section Navigation Tabs */}
      <div className="mb-6 flex items-center border-b border-border">
        <Link
          href="/admin/properties"
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-border hover:text-foreground transition-colors"
        >
          <Building2 className="h-4 w-4" /> Logements & Annonces
        </Link>
        <Link
          href="/admin/owners"
          className="flex items-center gap-2 border-b-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors"
        >
          <Users className="h-4 w-4" /> Propriétaires
        </Link>
      </div>

      {/* Metric Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Propriétaires</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {metrics.totalOwners}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">Comptes propriétaires enregistrés</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Biens publiés</span>
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {metrics.publishedProperties}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">Logements actifs en ligne</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>À vérifier</span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {metrics.pendingVerification}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">Comptes nécessitant validation</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un propriétaire..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Status Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium text-foreground focus:outline-none"
              >
                {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Portfolio Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={portfolioFilter}
                onChange={(e) => {
                  setPortfolioFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium text-foreground focus:outline-none"
              >
                {PORTFOLIO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Content Container */}
      <AsyncStateContainer
        isLoading={loading}
        isError={Boolean(error)}
        error={error ? { message: error } : null}
        isEmpty={owners.length === 0}
        onRetry={fetchOwners}
        loadingText="Chargement des propriétaires..."
        emptyTitle="Aucun propriétaire trouvé"
        emptyDescription="Aucun compte propriétaire ne correspond aux critères de recherche actuels."
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/80 text-[0.7rem] uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Propriétaire</th>
                  <th className="p-3.5 text-center">Biens</th>
                  <th className="p-3.5 text-center">Publiés</th>
                  <th className="p-3.5 text-center">Statut</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {owners.map((owner) => (
                  <tr
                    key={owner.id}
                    className="transition-colors hover:bg-surface/50"
                  >
                    {/* Owner Column */}
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        {owner.avatar ? (
                          <img
                            src={owner.avatar}
                            alt={owner.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-xs border border-primary/20">
                            {owner.initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs truncate">
                            {owner.fullName}
                          </p>
                          <p className="text-[0.72rem] text-muted-foreground truncate">
                            {owner.email}
                          </p>
                          {owner.phone && owner.phone !== "—" && (
                            <p className="text-[0.68rem] text-muted-foreground/80 font-mono">
                              {owner.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total Properties Column */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-md bg-surface px-2.5 py-1 text-xs font-bold text-foreground border border-border/60">
                        {owner.totalProperties} bien{owner.totalProperties > 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Published Properties Column */}
                    <td className="p-3.5 text-center">
                      {owner.publishedProperties > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="h-3 w-3" /> {owner.publishedProperties} publié{owner.publishedProperties > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-[0.72rem] text-muted-foreground">0</span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="p-3.5 text-center">
                      {getStatusBadge(owner.status)}
                    </td>

                    {/* Actions Column */}
                    <td className="p-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOwner(owner)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs hover:bg-surface transition-colors"
                          title="Voir la fiche propriétaire"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>Voir</span>
                        </button>
                        <Link
                          href={`/admin/properties?search=${encodeURIComponent(owner.email || owner.fullName)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                          title="Voir ses biens dans les annonces"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Biens</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface/50 px-4 py-3 text-xs">
            <span className="text-muted-foreground">
              Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong> · <strong>{totalCount}</strong> propriétaire{totalCount > 1 ? "s" : ""} au total
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface transition-colors"
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </AsyncStateContainer>

      {/* Owner Details Dialog Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-raised">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-surface/60 px-5 py-4">
              <div className="flex items-center gap-3">
                {selectedOwner.avatar ? (
                  <img
                    src={selectedOwner.avatar}
                    alt={selectedOwner.fullName}
                    className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-sm border border-primary/20">
                    {selectedOwner.initials}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {selectedOwner.fullName}
                  </h3>
                  <p className="text-xs text-muted-foreground">Fiche détaillée du propriétaire</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOwner(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Status and Verification Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-surface/50 p-3">
                <div>
                  <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase tracking-wider block">Statut du compte</span>
                  <div className="mt-1">{getStatusBadge(selectedOwner.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase tracking-wider block">Vérification</span>
                  <span className="inline-flex items-center gap-1 mt-1 font-semibold text-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" /> {selectedOwner.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 rounded-lg border border-border/80 p-3">
                <p className="text-[0.68rem] font-semibold text-muted-foreground uppercase tracking-wider">Coordonnées de contact</p>
                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{selectedOwner.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium font-mono">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{selectedOwner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>Secteur: {selectedOwner.area || "Mahdia"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>Membre depuis: {selectedOwner.since || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Portfolio Metrics Grid */}
              <div>
                <p className="text-[0.68rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Répartition du portefeuille</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg border border-border bg-surface p-2.5">
                    <span className="text-[0.65rem] text-muted-foreground block">Total Biens</span>
                    <span className="font-display text-lg font-bold text-foreground">{selectedOwner.totalProperties}</span>
                  </div>
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5">
                    <span className="text-[0.65rem] text-emerald-800 dark:text-emerald-300 block font-medium">Publiés</span>
                    <span className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">{selectedOwner.publishedProperties}</span>
                  </div>
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-2.5">
                    <span className="text-[0.65rem] text-amber-800 dark:text-amber-300 block font-medium">En examen</span>
                    <span className="font-display text-lg font-bold text-amber-700 dark:text-amber-400">{selectedOwner.pendingReviewProperties}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-2.5">
                    <span className="text-[0.65rem] text-muted-foreground block">Brouillon / Autre</span>
                    <span className="font-display text-lg font-bold text-foreground">{selectedOwner.draftProperties + selectedOwner.rejectedProperties}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-border bg-surface/60 px-5 py-3">
              <button
                type="button"
                onClick={() => setSelectedOwner(null)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
              >
                Fermer
              </button>
              <Link
                href={`/admin/properties?search=${encodeURIComponent(selectedOwner.email || selectedOwner.fullName)}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Voir tous ses biens</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
