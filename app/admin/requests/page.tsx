"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatusBadge } from "@/lib/admin-theme";
import {
  Clock,
  MapPin,
  Users,
  Home,
  Phone,
  ArrowRight,
  Search,
} from "lucide-react";

import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "PENDING", label: "Nouvelles demandes" },
  { value: "UNDER_REVIEW", label: "En cours d'examen" },
  { value: "PROPERTY_PROPOSED", label: "Logement proposé" },
  { value: "CLIENT_CONFIRMATION", label: "En attente confirmation" },
  { value: "CONFIRMED", label: "Réservations confirmées" },
  { value: "COMPLETED", label: "Séjours terminés" },
  { value: "REJECTED", label: "Non disponible" },
  { value: "CANCELLED", label: "Annulées" },
];

export default function AdminRequests() {
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
      setError(err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRequests();
  }, []);

  const filteredRequests = requestsList.filter((q) => {
    const customerName = q.customer?.fullName || q.customer || "";
    const phone = q.customer?.phone || q.phone || "";
    const dest = q.destination || q.area || "";
    const matchesSearch =
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      dest.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || (q.status || q.stage) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell
      title="Demandes & Réservations"
      subtitle={`${requestsList.length} demandes de location enregistrées dans la console`}
    >
      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par ID (REQ-...), nom, téléphone ou ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground focus:border-primary focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Statut :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none shadow-2xs"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AsyncStateContainer
        isLoading={loading}
        loadingText="Chargement des demandes clients en cours…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        isEmpty={filteredRequests.length === 0}
        emptyTitle="Aucune demande trouvée"
        emptyDescription="Aucune demande ne correspond à vos critères de recherche actuels."
        onRetry={fetchAdminRequests}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((q) => {
            const customerName =
              (typeof q.customer === "string" && q.customer) ||
              q.customer?.fullName ||
              (typeof q.customer === "object" && q.customer
                ? Object.values(q.customer).find((v) => typeof v === "string" && v)
                : null) ||
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
                    {q.propertyId && (
                      <AdminStatusBadge status="DIRECT" />
                    )}
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
                      <Users className="h-3.5 w-3.5 text-muted-foreground" /> {q.guests || q.people || 1} pers.
                    </span>
                    <span className="font-semibold text-foreground">
                      {budgetDisplay}
                    </span>
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
                    Fiche dossier <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </AsyncStateContainer>
    </AdminShell>
  );
}
