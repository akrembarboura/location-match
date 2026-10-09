"use client";

import { useState, useEffect, useMemo } from "react";
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
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminClientsPage() {
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "DIRECT" | "GENERAL" | "PHONE_VERIFIED">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchAdminRequests = async () => {
    try {
      setLoading(true);
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

  // Compute metrics summary
  const metrics = useMemo(() => {
    const total = requestsList.length;
    const direct = requestsList.filter((r) => r.propertyId).length;
    const general = requestsList.filter((r) => !r.propertyId).length;
    const withPhone = requestsList.filter((r) => r.customer?.phone || r.phone).length;
    return { total, direct, general, withPhone };
  }, [requestsList]);

  // Filter clients
  const filtered = useMemo(() => {
    return requestsList.filter((q) => {
      const customerName = (typeof q.customer === "string" ? q.customer : q.customer?.fullName) || "";
      const customerEmail = (typeof q.customer === "object" ? q.customer?.email : null) || q.email || "";
      const phone = (typeof q.customer === "object" ? q.customer?.phone : null) || q.phone || "";
      const dest = q.destination || q.area || "";
      const reqId = q.id || "";

      const matchesSearch =
        reqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        dest.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterType === "DIRECT") return matchesSearch && Boolean(q.propertyId);
      if (filterType === "GENERAL") return matchesSearch && !q.propertyId;
      if (filterType === "PHONE_VERIFIED") return matchesSearch && Boolean(phone);
      return matchesSearch;
    });
  }, [requestsList, searchQuery, filterType]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <AdminShell
      title="Répertoire Clients & Contacts"
      subtitle={`${requestsList.length} fiches contacts et dossiers de location enregistrés`}
    >
      {/* Metrics Banner */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Total Contacts</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{metrics.total}</p>
          <span className="text-[0.7rem] text-muted-foreground">Base clients LOC MAISON</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Réservations Directes</span>
            <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {metrics.direct}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">Dossiers sur logement spécifique</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Recherches Libres</span>
            <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{metrics.general}</p>
          <span className="text-[0.7rem] text-muted-foreground">Demandes sans bien assigné</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Téléphones Renseignés</span>
            <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{metrics.withPhone}</p>
          <span className="text-[0.7rem] text-muted-foreground">Joignables par WhatsApp / Tél</span>
        </div>
      </div>

      {/* Toolbar: Search & Tabbed Filters */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone, ID ou ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground focus:border-primary focus:outline-none shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filterType === "ALL"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              Tous ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("DIRECT")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filterType === "DIRECT"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              Directs ({metrics.direct})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("GENERAL")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filterType === "GENERAL"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              Libres ({metrics.general})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("PHONE_VERIFIED")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filterType === "PHONE_VERIFIED"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              Tél Valide ({metrics.withPhone})
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center min-h-[260px] flex items-center justify-center shadow-2xs">
          <LoadingThreeDotsJumping text="Chargement du répertoire clients…" size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-display text-sm font-bold text-foreground">Aucun client trouvé</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Aucun dossier ne correspond à vos filtres de recherche.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Client & Contact</th>
                  <th className="p-3.5">Téléphone / WhatsApp</th>
                  <th className="p-3.5">Destination & Statut</th>
                  <th className="p-3.5">Dossier / Logement Linked</th>
                  <th className="p-3.5">Dates du séjour</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedClients.map((q) => {
                  const customerName =
                    (typeof q.customer === "string" && q.customer) ||
                    q.customer?.fullName ||
                    "Client inconnu";
                  const customerEmail =
                    (typeof q.customer === "object" && q.customer?.email) || q.email;
                  const customerPhone =
                    (typeof q.customer === "object" && q.customer?.phone) || q.phone;
                  const dest = q.destination || q.area || "Mahdia";
                  const statusKey = q.status || q.stage || "PENDING";

                  const initials = customerName
                    .split(" ")
                    .map((n: string) => n[0])
                    .filter(Boolean)
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() || "CL";

                  const cleanPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, "") : null;

                  return (
                    <tr key={q.id} className="hover:bg-surface/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-xs border border-primary/20 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block text-xs">{customerName}</span>
                            {customerEmail ? (
                              <span className="text-[0.7rem] text-muted-foreground font-mono block">
                                {customerEmail}
                              </span>
                            ) : (
                              <span className="text-[0.7rem] text-muted-foreground italic">Email non spécifié</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {customerPhone ? (
                          <div className="space-y-1">
                            <span className="font-mono font-semibold text-foreground flex items-center gap-1 text-xs">
                              <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              {customerPhone}
                            </span>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <a
                                href={`tel:${customerPhone}`}
                                className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-primary hover:underline"
                              >
                                Appeler
                              </a>
                              <span className="text-muted-foreground">•</span>
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <MessageSquare className="h-3 w-3" /> WhatsApp
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[0.75rem] text-muted-foreground italic">Non renseigné</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="font-medium text-foreground flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            {dest} ({q.guests || q.people || 1} pers.)
                          </span>
                          <div>
                            <AdminStatusBadge status={statusKey} showDot />
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-[220px]">
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-primary block">#{q.id}</span>
                          {q.selectedPropertyDetails?.title ? (
                            <span className="text-[0.7rem] font-medium text-foreground truncate block bg-surface p-1 rounded border border-border/50">
                              {q.selectedPropertyDetails.title}
                            </span>
                          ) : (
                            <span className="text-[0.7rem] text-muted-foreground">Recherche générale</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[0.75rem] text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{q.checkIn || q.period || "N/A"} → {q.checkOut || "Flexible"}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/requests/${q.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary hover:bg-card transition-colors"
                        >
                          <span>Fiche client</span>
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-muted-foreground bg-surface/40">
              <div>
                Affichage de{" "}
                <strong className="text-foreground">
                  {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}
                </strong>{" "}
                à{" "}
                <strong className="text-foreground">
                  {Math.min(currentPage * pageSize, filtered.length)}
                </strong>{" "}
                sur <strong className="text-foreground">{filtered.length}</strong> client(s)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface disabled:opacity-40 transition-colors shadow-2xs"
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
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface disabled:opacity-40 transition-colors shadow-2xs"
                >
                  Suivant <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
