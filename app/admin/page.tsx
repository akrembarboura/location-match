"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { formatDT } from "@/lib/utils";
import {
  Inbox,
  Building2,
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

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

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/overview");
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des métriques.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les données du tableau de bord. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = data?.stats;
  const recentDeals = data?.recentDeals || [];

  return (
    <AdminShell title="Vue d'ensemble Admin" subtitle="Supervision générale et données d'exploitation en temps réel">
      <AsyncStateContainer
        isLoading={loading}
        loadingText="Chargement du tableau de bord d'administration…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        onRetry={fetchOverview}
      >
        <div className="space-y-8">
          {/* Quick Admin Actions */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Link
              href="/admin/requests"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/60 transition-all shadow-2xs group"
            >
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Traiter les demandes</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Réservations clients</span>
              </div>
            </Link>

            <Link
              href="/admin/properties"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/60 transition-all shadow-2xs group"
            >
              <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Modérer les biens</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Biens en attente</span>
              </div>
            </Link>

            <Link
              href="/admin/clients"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/60 transition-all shadow-2xs group"
            >
              <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Gérer les clients</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Comptes & Contacts</span>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/60 transition-all shadow-2xs group"
            >
              <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Statistiques</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Analytique & Performances</span>
              </div>
            </Link>
          </div>

          {/* Visual KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/requests" className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between hover:border-primary/50 transition-colors">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Demandes ouvertes</span>
                <p className="text-2xl font-bold font-display text-primary mt-1">{stats?.openRequests ?? 0}</p>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  {stats?.openRequests ? "En cours de traitement" : "Aucune demande en cours"}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Inbox className="h-6 w-6" />
              </div>
            </Link>

            <Link href="/admin/properties" className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between hover:border-primary/50 transition-colors">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Biens enregistrés</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1">{stats?.properties ?? 0}</p>
                <p className="text-[0.7rem] text-amber-700 dark:text-amber-400 mt-0.5">
                  {stats?.unverifiedProperties
                    ? `${stats.unverifiedProperties} en attente de contrôle`
                    : "Tous les biens sont vérifiés"}
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                <Building2 className="h-6 w-6" />
              </div>
            </Link>

            <div className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Contrats conclus</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1">{stats?.dealsCount ?? 0}</p>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  {stats?.dealsCount ? "Réservations confirmées" : "Aucune pour le moment"}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Marge générée</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1">{formatDT(stats?.totalMargin ?? 0)} DT</p>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">Commissions réelles cumulées</p>
              </div>
              <div className="rounded-xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Recent Deals Table Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Derniers Contrats & Transactions</h2>
              <Link href="/admin/requests" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Voir toutes les demandes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <div className="rounded-full bg-surface p-3 text-muted-foreground mb-2">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Aucun contrat récent</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les réservations confirmées et conclues avec commission apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Référence</th>
                      <th className="p-3.5">Bien</th>
                      <th className="p-3.5">Prix Propriétaire</th>
                      <th className="p-3.5">Offre Client</th>
                      <th className="p-3.5">Commission</th>
                      <th className="p-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentDeals.map((d) => (
                      <tr key={d.id} className="hover:bg-surface/50 transition-colors">
                        <td className="p-3.5 font-mono text-xs font-bold text-primary">{d.id}</td>
                        <td className="p-3.5 font-semibold text-foreground">{d.property}</td>
                        <td className="p-3.5 text-xs text-muted-foreground">{formatDT(d.ownerPrice)} DT</td>
                        <td className="p-3.5 text-xs text-muted-foreground">{formatDT(d.customerOffer)} DT</td>
                        <td className="p-3.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatDT(d.margin)} DT</td>
                        <td className="p-3.5 text-xs text-muted-foreground">{d.closed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AsyncStateContainer>
    </AdminShell>
  );
}
