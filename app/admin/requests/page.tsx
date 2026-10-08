"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Clock,
  MapPin,
  Users,
  Home,
  Phone,
  ArrowRight,
  Search,
  CheckCircle2,
} from "lucide-react";

import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "PENDING", label: "Nouvelles demandes (PENDING)" },
  { value: "UNDER_REVIEW", label: "En cours d'examen" },
  { value: "PROPERTY_PROPOSED", label: "Logement proposé" },
  { value: "CLIENT_CONFIRMATION", label: "En attente confirmation" },
  { value: "CONFIRMED", label: "Réservations confirmées" },
  { value: "COMPLETED", label: "Séjours terminés" },
  { value: "REJECTED", label: "Refusées / Non dispo" },
  { value: "CANCELLED", label: "Annulées" },
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Nouvelle demande", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  UNDER_REVIEW: { label: "En cours d'examen", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  PROPERTY_PROPOSED: { label: "Offre envoyée", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" },
  CLIENT_CONFIRMATION: { label: "En confirmation", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20" },
  CONFIRMED: { label: "Réservation confirmée", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  COMPLETED: { label: "Séjour terminé", color: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20" },
  REJECTED: { label: "Non disponible", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  CANCELLED: { label: "Annulée", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

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
      setRequestsList(data);
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
      title="Demandes & Réservations Clients"
      subtitle={`${requestsList.length} demandes de location enregistrées dans le système`}
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
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Statut :</label>
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
            const customerName = q.customer?.fullName || q.customer || "Client inconnu";
            const customerPhone = q.customer?.phone || q.phone;
            const dest = q.destination || q.area || "Non précisé";
            const statusKey = q.status || q.stage || "PENDING";
            const statusInfo = STATUS_BADGES[statusKey] || { label: statusKey, color: "bg-gray-100 text-gray-700 border-gray-200" };

            return (
              <Link
                key={q.id}
                href={`/admin/requests/${q.id}`}
                className="group block rounded-xl border border-border bg-card p-5 shadow-2xs transition-all hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{q.id}</span>
                    {q.propertyId && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Réservation directe
                      </span>
                    )}
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {customerName}
                  </h3>

                  {q.selectedPropertyDetails?.title && (
                    <div className="rounded-lg bg-surface p-2.5 border border-border/60 flex items-center gap-2 text-xs">
                      <Home className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        {q.selectedPropertyDetails.title}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {dest}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {q.guests || q.people || 1} pers.
                    </span>
                    <span className="font-semibold text-foreground">
                      {q.budget ? `${q.budget} DT` : "Budget libre"}
                    </span>
                  </div>

                  {customerPhone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" /> {customerPhone}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground">
                    Dates : {q.checkIn || q.period} → {q.checkOut || "flexible"}
                  </span>
                  <span className="font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Ouvrir la fiche <ArrowRight className="h-3.5 w-3.5" />
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
