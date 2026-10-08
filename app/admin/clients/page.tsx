"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatusBadge } from "@/lib/admin-theme";
import { LoadingThreeDotsJumping } from "@/components/shared/LoadingThreeDotsJumping";
import {
  Users,
  Search,
  Phone,
  Home,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function AdminClientsPage() {
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const fetchAdminRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests");
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setRequestsList(items);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRequests();
  }, []);

  const filtered = requestsList.filter((q) => {
    const customerName = q.customer?.fullName || q.customer || "";
    const phone = q.customer?.phone || q.phone || "";
    const dest = q.destination || q.area || "";
    const matchesSearch =
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      dest.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "DIRECT") return matchesSearch && Boolean(q.propertyId);
    if (filterType === "GENERAL") return matchesSearch && !q.propertyId;
    return matchesSearch;
  });

  return (
    <AdminShell
      title="Espace Clients & Contacts"
      subtitle="Fiches contacts et historique des demandes de réservation directes"
    >
      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un client, téléphone, ID ou destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground focus:border-primary focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("ALL")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filterType === "ALL"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            Tous les clients ({requestsList.length})
          </button>
          <button
            onClick={() => setFilterType("DIRECT")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filterType === "DIRECT"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            Réservations directes ({requestsList.filter((r) => r.propertyId).length})
          </button>
          <button
            onClick={() => setFilterType("GENERAL")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filterType === "GENERAL"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            Recherches libres ({requestsList.filter((r) => !r.propertyId).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center min-h-[260px] flex items-center justify-center shadow-2xs">
          <LoadingThreeDotsJumping text="Chargement des fiches clients…" size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-display text-sm font-bold text-foreground">Aucun client trouvé</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Aucun dossier client ne correspond à vos critères de recherche actuels.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => {
            const customerName = q.customer?.fullName || q.customer || "Client inconnu";
            const customerPhone = q.customer?.phone || q.phone;
            const dest = q.destination || q.area || "Mahdia";
            const statusKey = q.status || q.stage || "PENDING";

            return (
              <Link
                key={q.id}
                href={`/admin/requests/${q.id}`}
                className="group block rounded-xl border border-border bg-card p-4.5 shadow-2xs transition-all hover:border-primary/50 hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">{q.id}</span>
                    <AdminStatusBadge status={q.propertyId ? "DIRECT" : "GENERAL"} />
                  </div>
                  <AdminStatusBadge status={statusKey} showDot />
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {customerName}
                    </h3>
                    {customerPhone && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface border border-border px-2 py-0.5 text-[0.7rem] font-mono text-foreground">
                        <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> {customerPhone}
                      </span>
                    )}
                  </div>

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
                    <span className="font-semibold text-foreground">
                      {q.budget ? `${q.budget} DT` : "Budget libre"}
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                  <span className="text-muted-foreground text-[0.75rem]">
                    {q.checkIn || q.period} → {q.checkOut || "flexible"}
                  </span>
                  <span className="font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                    Fiche client <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
