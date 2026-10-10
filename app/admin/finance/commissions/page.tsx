"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { formatDT } from "@/lib/utils";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Download } from "lucide-react";

export default function CommissionRegisterPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flowFilter, setFlowFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ totalPages: number; total: number }>({ totalPages: 1, total: 0 });

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        flow: flowFilter,
        search,
      });
      const res = await fetch(`/api/admin/finance/commissions?${query.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement du registre de commissions.");
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [page, flowFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCommissions();
  };

  return (
    <AdminShell title="Registre des Commissions" subtitle="Snapshots historiques des commissions enregistrées lors des confirmations">
      <div className="space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par n° réservation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={flowFilter}
                onChange={(e) => {
                  setFlowFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
              >
                <option value="ALL">Tous les canaux</option>
                <option value="OWNER_DIRECT">Direct Propriétaire</option>
                <option value="PLATFORM_COLLECTS">Collecte Plateforme</option>
                <option value="MIXED">Mixte</option>
                <option value="UNRESOLVED">Non résolu (À réconcilier)</option>
              </select>
            </div>

            <a
              href="/api/admin/finance/reports/export?type=commissions"
              download
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors border border-border"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </div>
        </div>

        {/* Data Table */}
        <AsyncStateContainer
          isLoading={loading}
          isError={Boolean(error)}
          error={error}
          isEmpty={items.length === 0}
          emptyTitle="Aucun snapshot de commission"
          emptyDescription="Aucune commission enregistrée ne correspond à vos critères."
          onRetry={fetchCommissions}
        >
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="p-4">Réservation</th>
                    <th className="p-4">Propriétaire</th>
                    <th className="p-4">Base Locative</th>
                    <th className="p-4">Taux</th>
                    <th className="p-4">Commission Gagnée</th>
                    <th className="p-4">Recouvré (Vérifié)</th>
                    <th className="p-4">Solde Reste</th>
                    <th className="p-4">Canal</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Aucun snapshot de commission trouvé pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-mono font-medium text-foreground">
                          <Link href={`/admin/finance/commissions/${item.id}`} className="hover:underline text-primary">
                            {item.reservationId}
                          </Link>
                          <div className="text-xs text-muted-foreground font-sans">{item.propertyTitle}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-foreground">{item.ownerName}</div>
                          <div className="text-xs text-muted-foreground">{item.ownerPhone}</div>
                        </td>
                        <td className="p-4 font-mono">{formatDT(item.rentalBasis)}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            {item.rate}% ({item.scope})
                          </span>
                        </td>
                        <td className="p-4 font-mono font-semibold text-foreground">{formatDT(item.calculatedCommission)}</td>
                        <td className="p-4 font-mono font-medium text-foreground">
                          {formatDT(item.verifiedCollected)}
                        </td>
                        <td className="p-4 font-mono font-semibold text-foreground">
                          {formatDT(item.outstandingAmount)}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                            {item.collectionFlow}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/admin/finance/commissions/${item.id}`}
                            className="p-1.5 inline-flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Inspecter le snapshot"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Page {page} sur {pagination.totalPages} ({pagination.total} éléments)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </AsyncStateContainer>
      </div>
    </AdminShell>
  );
}

