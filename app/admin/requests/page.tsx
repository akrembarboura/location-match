"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatusBadge } from "@/lib/admin-theme";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import {
  Clock,
  MapPin,
  Users,
  Home,
  Phone,
  ArrowRight,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Inbox,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { id: "ALL", label: "Toutes les demandes" },
  { id: "PENDING", label: "Nouvelles" },
  { id: "UNDER_REVIEW", label: "En examen" },
  { id: "PROPERTY_PROPOSED", label: "Offres envoyées" },
  { id: "CONFIRMED", label: "Confirmées" },
  { id: "COMPLETED", label: "Terminées" },
  { id: "REJECTED_CANCELLED", label: "Refusées / Annulées" },
] as const;

export default function AdminRequests() {
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DIRECT" | "GENERAL">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchAdminRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/requests");
      if (!res.ok) {
        throw new Error("Impossible de charger la liste des demandes.");
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items || [];
      setRequestsList(items);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRequests();
  }, []);

  // Compute stats summary
  const stats = useMemo(() => {
    const total = requestsList.length;
    const direct = requestsList.filter((q) => q.propertyId).length;
    const pending = requestsList.filter((q) => (q.status || q.stage) === "PENDING").length;
    const confirmed = requestsList.filter((q) => (q.status || q.stage) === "CONFIRMED").length;
    return { total, direct, pending, confirmed };
  }, [requestsList]);

  // Filter logic
  const filteredRequests = useMemo(() => {
    return requestsList.filter((q) => {
      const customerName = (typeof q.customer === "string" ? q.customer : q.customer?.fullName) || "";
      const phone = (typeof q.customer === "object" ? q.customer?.phone : null) || q.phone || "";
      const dest = q.destination || q.area || "";
      const reqId = q.id || "";

      const matchesSearch =
        reqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        dest.toLowerCase().includes(searchQuery.toLowerCase());

      const statusKey = q.status || q.stage || "PENDING";
      let matchesTab = true;
      if (activeTab === "REJECTED_CANCELLED") {
        matchesTab = statusKey === "REJECTED" || statusKey === "CANCELLED";
      } else if (activeTab !== "ALL") {
        matchesTab = statusKey === activeTab;
      }

      let matchesType = true;
      if (typeFilter === "DIRECT") matchesType = Boolean(q.propertyId);
      if (typeFilter === "GENERAL") matchesType = !q.propertyId;

      return matchesSearch && matchesTab && matchesType;
    });
  }, [requestsList, searchQuery, activeTab, typeFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, typeFilter]);

  // Paginated records
  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  return (
    <AdminShell
      title="Demandes & Réservations"
      subtitle={`${requestsList.length} demandes de location enregistrées dans la console`}
    >
      {/* Metric Summary Banner */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Total Demandes</span>
            <Inbox className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-black dark:text-white">{stats.total}</p>
          <span className="text-[0.7rem] text-muted-foreground">Enregistrées au catalogue</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>En attente</span>
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-black dark:text-white">
            {stats.pending}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">Nécessitent un traitement</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Réservations Directes</span>
            <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-black dark:text-white">{stats.direct}</p>
          <span className="text-[0.7rem] text-muted-foreground">Attachées à un logement</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Confirmées</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-black dark:text-white">
            {stats.confirmed}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">Dossiers validés</span>
        </div>
      </div>

      {/* Filter Tabs & Operational Controls */}
      <div className="mb-5 space-y-3">
        {/* Status Tabs (Linear-inspired) */}
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
          {STATUS_TABS.map((tab) => {
            const count = requestsList.filter((q) => {
              const statusKey = q.status || q.stage || "PENDING";
              if (tab.id === "ALL") return true;
              if (tab.id === "REJECTED_CANCELLED") return statusKey === "REJECTED" || statusKey === "CANCELLED";
              return statusKey === tab.id;
            }).length;

            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search + Secondary Filters + View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 min-w-[260px] max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par réf (REQ-...), client, téléphone ou destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-2xs"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none shadow-2xs"
            >
              <option value="ALL">Tous les types</option>
              <option value="DIRECT">Directes (avec logement)</option>
              <option value="GENERAL">Recherches libres</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
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

      {/* Content Container */}
      <AsyncStateContainer
        isLoading={loading}
        loadingText="Chargement des demandes d'exploitation…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        isEmpty={filteredRequests.length === 0}
        emptyTitle="Aucune demande trouvée"
        emptyDescription="Aucune demande ne correspond aux filtres de recherche appliqués."
        onRetry={fetchAdminRequests}
      >
        {viewMode === "table" ? (
          /* Operational Data Table */
          <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/80 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Référence & Type</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Destination / Biens</th>
                    <th className="p-3.5">Dates & Séjour</th>
                    <th className="p-3.5">Budget</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedRequests.map((q) => {
                    const customerName =
                      (typeof q.customer === "string" && q.customer) ||
                      q.customer?.fullName ||
                      "Client inconnu";
                    const customerPhone =
                      (typeof q.customer === "object" && q.customer?.phone) || q.phone;
                    const dest = q.destination || q.area || "Mahdia";
                    const statusKey = q.status || q.stage || "PENDING";
                    const budgetDisplay = q.budget
                      ? String(q.budget).includes("DT")
                        ? q.budget
                        : `${q.budget} DT`
                      : "Budget libre";

                    return (
                      <tr key={q.id} className="hover:bg-surface/60 transition-colors">
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-primary text-xs">{q.id}</span>
                            <div>
                              {q.propertyId ? (
                                <AdminStatusBadge status="DIRECT" />
                              ) : (
                                <AdminStatusBadge status="GENERAL" />
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">{customerName}</span>
                            <span className="text-muted-foreground text-[0.7rem] flex items-center gap-1">
                              <Users className="h-3 w-3" /> {q.guests || q.people || 1} personne(s)
                            </span>
                            {customerPhone && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[0.7rem] font-mono flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {customerPhone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-1 max-w-[220px]">
                            <span className="font-medium text-foreground flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{dest}</span>
                            </span>
                            {q.selectedPropertyDetails?.title && (
                              <span className="text-[0.7rem] text-muted-foreground line-clamp-1 block bg-surface px-2 py-0.5 rounded border border-border/50">
                                {q.selectedPropertyDetails.title}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[0.75rem] text-foreground font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{q.checkIn || q.period || "N/A"} → {q.checkOut || "Flexible"}</span>
                          </div>
                        </td>

                        <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">
                          {budgetDisplay}
                        </td>

                        <td className="p-3.5">
                          <AdminStatusBadge status={statusKey} showDot />
                        </td>

                        <td className="p-3.5 text-right">
                          <Link
                            href={`/admin/requests/${q.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary hover:bg-card transition-colors"
                          >
                            <span>Dossier</span>
                            <ArrowRight className="h-3.5 w-3.5 text-primary" />
                          </Link>
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
            {paginatedRequests.map((q) => {
              const customerName =
                (typeof q.customer === "string" && q.customer) ||
                q.customer?.fullName ||
                "Client inconnu";
              const customerPhone =
                (typeof q.customer === "object" && q.customer?.phone) || q.phone;
              const dest = q.destination || q.area || "Mahdia";
              const statusKey = q.status || q.stage || "PENDING";
              const budgetDisplay = q.budget
                ? String(q.budget).includes("DT")
                  ? q.budget
                  : `${q.budget} DT`
                : "Budget libre";

              return (
                <Link
                  key={q.id}
                  href={`/admin/requests/${q.id}`}
                  className="group block rounded-xl border border-border bg-card p-4.5 shadow-2xs transition-all hover:border-primary/50 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{q.id}</span>
                      {q.propertyId && <AdminStatusBadge status="DIRECT" />}
                    </div>
                    <AdminStatusBadge status={statusKey} showDot />
                  </div>

                  <div className="mt-3 space-y-2">
                    <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {customerName}
                    </h3>

                    {q.selectedPropertyDetails?.title && (
                      <div className="rounded-lg bg-surface p-2.5 border border-border/60 flex items-center gap-2 text-xs">
                        <Home className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {q.selectedPropertyDetails.title}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> {dest}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {q.guests || q.people || 1} pers.
                      </span>
                      <span className="font-semibold text-foreground">{budgetDisplay}</span>
                    </div>

                    {customerPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> {customerPhone}
                      </p>
                    )}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                    <span className="text-muted-foreground text-[0.75rem]">
                      {q.checkIn || q.period} → {q.checkOut || "flexible"}
                    </span>
                    <span className="font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                      Dossier <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredRequests.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <div>
              Affichage de{" "}
              <strong className="text-foreground">
                {Math.min((currentPage - 1) * pageSize + 1, filteredRequests.length)}
              </strong>{" "}
              à{" "}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, filteredRequests.length)}
              </strong>{" "}
              sur <strong className="text-foreground">{filteredRequests.length}</strong> demande(s)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 transition-colors"
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
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 transition-colors"
              >
                Suivant <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </AsyncStateContainer>
    </AdminShell>
  );
}
