"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { formatDT } from "@/lib/utils";
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Clock, History, User, Building2 } from "lucide-react";

export default function CommissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/finance/commissions/${id}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des détails de la commission.");
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  return (
    <AdminShell title={`Commission Snapshot — ${id}`} subtitle="Preuve historique immuable et audit de réconciliation">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/finance/commissions"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-semibold hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour au registre
          </Link>
        </div>

        <AsyncStateContainer
          isLoading={loading}
          isError={Boolean(error)}
          error={error}
          isEmpty={!data}
          emptyTitle="Commission introuvable"
          emptyDescription="Le snapshot de commission demandé n'existe pas."
          onRetry={fetchDetail}
        >
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Snapshot & Breakdown (2 Cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Snapshot Card */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">Snapshot Historique Immuable</h3>
                        <p className="text-xs text-muted-foreground">ID Snapshot: {data.snapshot.id}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs rounded-full border border-emerald-500/20">
                      Généré à la confirmation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <span className="text-xs text-muted-foreground block">Taux Appliqué</span>
                      <span className="text-lg font-bold text-primary font-mono">{data.snapshot.rate}%</span>
                      <span className="text-[0.65rem] text-muted-foreground block">Source: {data.snapshot.scope}</span>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block">Base Locative</span>
                      <span className="text-lg font-bold text-foreground font-mono">{formatDT(data.snapshot.rentalBasis)}</span>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block">Commission Calculée</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatDT(data.snapshot.calculatedCommission)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Mode de calcul:</span>
                      <span className="font-semibold text-foreground">{data.snapshot.calculationMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Canal d'encaissement:</span>
                      <span className="font-semibold text-foreground">{data.snapshot.collectionFlow}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date de confirmation:</span>
                      <span className="font-mono text-foreground">
                        {data.snapshot.confirmedAt ? new Date(data.snapshot.confirmedAt).toLocaleString("fr-FR") : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ledger Audit Trail for this Reservation */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <History className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground text-base">Historique des Écritures du Ledger</h3>
                  </div>

                  <div className="space-y-3">
                    {data.ledgerTransactions.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Aucune écriture enregistrée.</p>
                    ) : (
                      data.ledgerTransactions.map((tx: any) => (
                        <div key={tx.id} className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-xs text-foreground">{tx.type}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold ${
                                  tx.status === "VERIFIED"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : tx.status === "REPORTED"
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-rose-500/10 text-rose-600"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{tx.notes}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-foreground">{formatDT(tx.amount)}</div>
                            <span className="text-[0.65rem] text-muted-foreground block">{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Context Sidebar (1 Col) */}
              <div className="space-y-6">
                {/* Linked Reservation Info */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm text-foreground">Réservation Associée</h4>
                  </div>
                  {data.reservation ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Client</span>
                        <span className="font-medium text-foreground">{data.reservation.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Statut Réservation</span>
                        <span className="font-semibold text-emerald-600">{data.reservation.status}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Dates du séjour</span>
                        <span className="font-mono text-foreground">
                          {new Date(data.reservation.checkIn).toLocaleDateString()} - {new Date(data.reservation.checkOut).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Réservation non trouvée.</p>
                  )}
                </div>

                {/* Owner Info */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <User className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm text-foreground">Propriétaire</h4>
                  </div>
                  {data.owner ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Nom</span>
                        <span className="font-medium text-foreground">
                          {data.owner.firstName} {data.owner.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Téléphone</span>
                        <span className="font-mono text-foreground">{data.owner.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Email</span>
                        <span className="text-foreground">{data.owner.email}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Propriétaire non trouvé.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </AsyncStateContainer>
      </div>
    </AdminShell>
  );
}

