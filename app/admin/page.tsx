"use client";

import { useEffect, useState } from "react";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import { formatDT } from "@/lib/utils";
import { Loader2, AlertCircle, FileText } from "lucide-react";

interface AdminOverviewData {
  stats: {
    openRequests: number;
    properties: number;
    unverifiedProperties: number;
    dealsCount: number;
    totalMargin: number;
  };
  recentDeals: Array<{
    id: string;
    property: string;
    ownerPrice: number;
    customerOffer: number;
    margin: number;
    closed: string;
  }>;
}

export default function AdminHome() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/overview");
        if (!res.ok) {
          throw new Error("Erreur de chargement");
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Impossible de charger les données du tableau de bord. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  const stats = data?.stats;
  const recentDeals = data?.recentDeals || [];

  return (
    <AdminShell title="Vue d'ensemble" subtitle="Données d'exploitation en temps réel">
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Calcul des métriques de la plateforme…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Demandes ouvertes"
              value={String(stats?.openRequests ?? 0)}
              accent
              hint={stats?.openRequests ? "Demandes actives en attente de traitement" : "Aucune demande en cours"}
            />
            <StatCard
              label="Biens enregistrés"
              value={String(stats?.properties ?? 0)}
              hint={
                stats?.unverifiedProperties
                  ? `${stats.unverifiedProperties} en attente de contrôle`
                  : "Tous les biens sont vérifiés"
              }
            />
            <StatCard
              label="Contrats conclus"
              value={String(stats?.dealsCount ?? 0)}
              hint={stats?.dealsCount ? "Total des réservations finalisées" : "Aucun contrat conclu pour le moment"}
            />
            <StatCard
              label="Marge générée"
              value={`${formatDT(stats?.totalMargin ?? 0)} DT`}
              hint="Cumul des commissions réelles"
            />
          </div>

          <h2 className="mt-8 font-display text-lg text-foreground">Contrats récents</h2>
          {recentDeals.length === 0 ? (
            <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <div className="rounded-full bg-surface p-2.5 text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">Aucun contrat récent</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Les contrats apparaîtront ici dès que des réservations seront confirmées et conclues.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">Contrat</th>
                    <th className="p-3">Bien</th>
                    <th className="p-3">Propriétaire</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Marge</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeals.map((d) => (
                    <tr key={d.id} className="border-t border-border hover:bg-surface/50">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{d.id}</td>
                      <td className="p-3 font-medium text-foreground">{d.property}</td>
                      <td className="p-3 text-muted-foreground">{formatDT(d.ownerPrice)} DT</td>
                      <td className="p-3 text-muted-foreground">{formatDT(d.customerOffer)} DT</td>
                      <td className="p-3 font-semibold text-primary">{formatDT(d.margin)} DT</td>
                      <td className="p-3 text-xs text-muted-foreground">{d.closed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
