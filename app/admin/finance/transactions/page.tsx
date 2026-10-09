"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { formatDT } from "@/lib/utils";
import { Filter, CheckCircle2, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminTransactionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ totalPages: number; total: number }>({ totalPages: 1, total: 0 });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        status: statusFilter,
        type: typeFilter,
      });
      const res = await fetch(`/api/admin/finance/transactions?${query.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement des transactions.");
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
    fetchTransactions();
  }, [page, statusFilter, typeFilter]);

  const handleVerify = async (id: string) => {
    try {
      setActionMessage(null);
      const res = await fetch(`/api/admin/finance/transactions/${id}/verify`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionMessage("Transaction vérifiée avec succès.");
        fetchTransactions();
      } else {
        alert(data.error || "Échec de la vérification.");
      }
    } catch {
      alert("Erreur lors de l'action.");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Veuillez saisir le motif du rejet :");
    if (!reason) return;
    try {
      setActionMessage(null);
      const res = await fetch(`/api/admin/finance/transactions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage("Transaction rejetée.");
        fetchTransactions();
      } else {
        alert(data.error || "Échec du rejet.");
      }
    } catch {
      alert("Erreur lors du rejet.");
    }
  };

  const handleReverse = async (id: string) => {
    const reason = prompt("Veuillez saisir la raison de l'annulation (extourne) :");
    if (!reason) return;
    try {
      setActionMessage(null);
      const res = await fetch(`/api/admin/finance/transactions/${id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage("Transaction annulée et extournée.");
        fetchTransactions();
      } else {
        alert(data.error || "Échec de l'annulation.");
      }
    } catch {
      alert("Erreur lors de l'annulation.");
    }
  };

  return (
    <AdminShell title="Gestion des Transactions" subtitle="Console d'audit, de vérification et d'extourne des règlements">
      <div className="space-y-6">
        {actionMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            {actionMessage}
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="REPORTED">Déclaré (À vérifier)</option>
                <option value="VERIFIED">Vérifié</option>
                <option value="REJECTED">Rejeté</option>
                <option value="REVERSED">Extourné</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
            >
              <option value="ALL">Tous les types</option>
              <option value="COMMISSION_OBLIGATION">Obligation Commission</option>
              <option value="COMMISSION_REMITTANCE">Versement Commission</option>
              <option value="RENTAL_COLLECTION">Encaissement Loyer</option>
              <option value="REVERSAL">Extourne</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <AsyncStateContainer isLoading={loading} error={error} onRetry={fetchTransactions}>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="p-4">ID Transaction</th>
                    <th className="p-4">Réservation</th>
                    <th className="p-4">Propriétaire</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Sens</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Aucune transaction trouvée.
                      </td>
                    </tr>
                  ) : (
                    items.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-mono font-medium text-foreground">{t.id}</td>
                        <td className="p-4 font-mono text-xs">{t.reservationId}</td>
                        <td className="p-4">{t.ownerName}</td>
                        <td className="p-4 text-xs font-semibold">{t.type}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              t.direction === "CREDIT" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {t.direction}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold">{formatDT(t.amount)}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              t.status === "VERIFIED"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : t.status === "REPORTED"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {t.status === "REPORTED" && (
                            <>
                              <button
                                onClick={() => handleVerify(t.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                Vérifier
                              </button>
                              <button
                                onClick={() => handleReject(t.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                          {t.status === "VERIFIED" && t.type !== "REVERSAL" && (
                            <button
                              onClick={() => handleReverse(t.id)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              Extourner
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

