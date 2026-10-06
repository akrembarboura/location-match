"use client";

import React, { useEffect, useState } from "react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { formatDT } from "@/lib/utils";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  Wallet,
  Building2,
  CheckCircle2,
  TrendingUp,
  Receipt,
} from "lucide-react";

export default function OwnerPaymentsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        const res = await fetch("/api/owner/payments");
        if (!res.ok) throw new Error("Erreur de chargement des données financières");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Impossible de charger les données financières.");
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  return (
    <OwnerShell
      title="Suivi des paiements & Revenus"
      subtitle="Consultez le chiffre d'affaires brut, les montants encaissés et le solde à recevoir"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement des données financières…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* LOC MAISON Verification Notice */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs text-foreground">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Suivi et confirmation des paiements</p>
              <p className="text-muted-foreground mt-0.5">
                Les règlements et acomptes sont vérifiés et confirmés directement par l&apos;équipe LOC MAISON. Vos revenus bruts s&apos;actualisent au fur et à mesure des encaissements.
              </p>
            </div>
          </div>

          {/* Unified Financial KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chiffre d&apos;affaires brut</span>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold font-display text-foreground">
                {formatDT(data?.summary?.grossRevenue || 0)} DT
              </p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">Total des réservations confirmées</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Déjà encaissé</span>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold font-display text-foreground">
                {formatDT(data?.summary?.totalPaid || 0)} DT
              </p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">Acomptes & paiements validés</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">À recevoir</span>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold font-display text-foreground">
                {formatDT(data?.summary?.totalToReceive || 0)} DT
              </p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">Solde restant à l&apos;arrivée</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Locations confirmées</span>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold font-display text-foreground">
                {data?.summary?.confirmedCount || 0}
              </p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">Nombre de séjours validés</p>
            </div>
          </div>

          {/* Revenue Breakdown per Property */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Répartition par logement
            </h2>

            {data?.propertyBreakdown?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun logement trouvé.</p>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-surface font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-3.5">Logement</th>
                        <th className="p-3.5">Réservations</th>
                        <th className="p-3.5">Chiffre d&apos;affaires brut</th>
                        <th className="p-3.5">Payé</th>
                        <th className="p-3.5">À recevoir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data?.propertyBreakdown?.map((prop: any) => (
                        <tr key={prop.id} className="hover:bg-surface/50">
                          <td className="p-3.5 font-semibold text-foreground">{prop.title}</td>
                          <td className="p-3.5 text-muted-foreground">{prop.reservationsCount} séjour(s)</td>
                          <td className="p-3.5 font-bold text-foreground">{formatDT(prop.gross)} DT</td>
                          <td className="p-3.5 font-medium text-foreground">{formatDT(prop.paid)} DT</td>
                          <td className="p-3.5 font-medium text-muted-foreground">{formatDT(prop.remaining)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </OwnerShell>
  );
}
