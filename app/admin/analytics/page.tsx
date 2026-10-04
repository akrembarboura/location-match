"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import type { AdminAnalyticsOverview, PropertyPerformance } from "@/lib/analytics/types";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Search,
  Eye,
  FileCheck,
  CalendarCheck,
  Building,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [
  { id: "7d", label: "7 derniers jours" },
  { id: "30d", label: "30 derniers jours" },
  { id: "90d", label: "90 derniers jours" },
  { id: "all", label: "Tout l'historique" },
] as const;

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [data, setData] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (selectedPeriod: "7d" | "30d" | "90d" | "all") => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/analytics?period=${selectedPeriod}`);
      if (!res.ok) {
        throw new Error("Impossible de charger les données analytiques.");
      }
      const json: AdminAnalyticsOverview = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const stats = data?.stats;
  const customerFunnel = data?.customerFunnel;
  const ownerFunnel = data?.ownerFunnel;
  const topProperties = data?.topProperties || [];
  const lowConversion = data?.lowConversionProperties || [];
  const demandVsSupply = data?.demandVsSupply?.destinations || [];

  return (
    <AdminShell
      title="Statistiques & Performance"
      subtitle="Données d'exploitation réelles, conversion du marché et comportement utilisateurs"
    >
      <section
        aria-labelledby="analytics-period-heading"
        className="mb-6 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-soft p-2 text-primary">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="analytics-period-heading" className="font-display text-sm font-semibold text-foreground">
                Période d’analyse
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Choisissez la période à utiliser pour les indicateurs ci-dessous.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/20 bg-primary-soft px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            title="Rafraîchir les statistiques en direct"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Actualiser
          </button>
        </div>

        <div
          role="group"
          aria-label="Période d’analyse"
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                period === p.id
                  ? "border-primary bg-primary-soft text-primary shadow-sm"
                  : "border-border bg-surface/50 text-muted-foreground hover:border-primary/30 hover:bg-primary-soft/50 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 hidden text-xs text-muted-foreground sm:block">
            Données calculées en direct depuis les événements et la base d&apos;exploitation.
        </p>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Agrégation des métriques en temps réel…
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 p-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            className="mt-4 rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label="Visiteurs uniques"
              value={String(stats?.visitors ?? 0)}
              hint="Sessions anonymes et identifiées"
            />
            <StatCard
              label="Recherches"
              value={String(stats?.searches ?? 0)}
              hint="Requêtes formulées sur le site"
            />
            <StatCard
              label="Vues de biens"
              value={String(stats?.propertyViews ?? 0)}
              hint="Fiches détaillées ouvertes"
            />
            <StatCard
              label="Demandes formulées"
              value={String(stats?.requests ?? 0)}
              accent
              hint="Dossiers clients déposés"
            />
            <StatCard
              label="Propositions envoyées"
              value={String(stats?.proposals ?? 0)}
              hint={`${stats?.acceptedProposals ?? 0} acceptée(s) par les clients`}
            />
            <StatCard
              label="Réservations"
              value={String(stats?.reservations ?? 0)}
              accent
              hint="Biens verrouillés pour les clients"
            />
          </div>

          {/* Customer Funnel & Owner Funnel Grids */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Customer Funnel */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-base text-foreground">Entonnoir Client (Demande)</h2>
                </div>
                <span className="text-xs text-muted-foreground">Taux de conversion d&apos;étape</span>
              </div>

              <div className="mt-5 space-y-4">
                <FunnelStep
                  label="1. Visiteurs"
                  count={customerFunnel?.visitors ?? 0}
                  icon={Users}
                  conversionRate={null}
                />
                <FunnelStep
                  label="2. Recherches effectuées"
                  count={customerFunnel?.searches ?? 0}
                  icon={Search}
                  conversionRate={customerFunnel?.conversions?.visitorToSearch}
                  rateLabel="des visiteurs cherchent"
                />
                <FunnelStep
                  label="3. Fiches de biens consultées"
                  count={customerFunnel?.propertyViews ?? 0}
                  icon={Eye}
                  conversionRate={customerFunnel?.conversions?.searchToView}
                  rateLabel="des recherches mènent à une vue"
                />
                <FunnelStep
                  label="4. Demandes de location soumises"
                  count={customerFunnel?.requests ?? 0}
                  icon={FileCheck}
                  accent
                  conversionRate={customerFunnel?.conversions?.viewToRequest}
                  rateLabel="des vues convertissent en demande"
                />
                <FunnelStep
                  label="5. Propositions formulées"
                  count={customerFunnel?.proposals ?? 0}
                  icon={Building}
                  conversionRate={customerFunnel?.conversions?.requestToProposal}
                  rateLabel="des demandes reçoivent une proposition"
                />
                <FunnelStep
                  label="6. Réservations conclues"
                  count={customerFunnel?.reservations ?? 0}
                  icon={CalendarCheck}
                  accent
                  conversionRate={customerFunnel?.conversions?.proposalToReservation}
                  rateLabel="des propositions aboutissent à une réservation"
                />
              </div>
            </div>

            {/* Owner Funnel & Demand vs Supply */}
            <div className="space-y-6">
              {/* Owner Funnel */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-base text-foreground">Entonnoir Propriétaire (Offre)</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">Acquisition d&apos;inventaire</span>
                </div>

                <div className="mt-5 space-y-3.5">
                  <FunnelStep
                    label="Clics CTA Propriétaire"
                    count={ownerFunnel?.ctaClicks ?? 0}
                    icon={ArrowRight}
                    conversionRate={null}
                  />
                  <FunnelStep
                    label="Comptes Propriétaires créés"
                    count={ownerFunnel?.signups ?? 0}
                    icon={Users}
                    conversionRate={ownerFunnel?.conversions?.ctaToSignup}
                    rateLabel="de conversion inscription"
                  />
                  <FunnelStep
                    label="Biens enregistrés (brouillons inclus)"
                    count={ownerFunnel?.propertiesCreated ?? 0}
                    icon={Building}
                    conversionRate={ownerFunnel?.conversions?.signupToCreated}
                    rateLabel="créent au moins un bien"
                  />
                  <FunnelStep
                    label="Biens soumis pour vérification"
                    count={ownerFunnel?.propertiesSubmitted ?? 0}
                    icon={FileCheck}
                    conversionRate={ownerFunnel?.conversions?.createdToSubmitted}
                    rateLabel="soumettent pour validation"
                  />
                  <FunnelStep
                    label="Biens vérifiés et publiés"
                    count={ownerFunnel?.propertiesApproved ?? 0}
                    icon={CalendarCheck}
                    accent
                    conversionRate={ownerFunnel?.conversions?.submittedToApproved}
                    rateLabel="validés par la modération"
                  />
                </div>
              </div>

              {/* Demand vs Supply Overview */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="font-display text-sm text-foreground">Tension Marché : Demande vs Offre</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparatif des intentions de recherche et des biens effectivement publiés par ville.
                </p>

                <div className="mt-4 space-y-2.5">
                  {demandVsSupply.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Aucune donnée de localisation enregistrée.</p>
                  ) : (
                    demandVsSupply.map((d) => (
                      <div
                        key={d.city}
                        className="flex items-center justify-between rounded-lg border border-border bg-surface/50 p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{d.city}</p>
                          <p className="text-muted-foreground mt-0.5">
                            {d.searches} recherche(s) · {d.requests} demande(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{d.availableProperties} bien(s) publié(s)</p>
                          <span
                            className={cn(
                              "inline-block rounded px-2 py-0.5 text-[10px] font-semibold mt-1",
                              d.gapNote?.includes("Forte demande") || d.gapNote?.includes("supérieure")
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {d.gapNote}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Conversion Properties Alert Callout */}
          {lowConversion.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Biens à forte visibilité mais faible conversion (À auditer)
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Ces biens génèrent un trafic important mais peu ou pas de demandes de réservation. Une inspection humaine de l&apos;annonce (prix trop élevé, photos peu engageantes ou description insuffisante) est recommandée.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowConversion.map((p) => (
                  <Link
                    key={p.propertyId}
                    href={`/admin/properties/${p.propertyId}`}
                    className="flex flex-col justify-between rounded-lg border border-amber-200 dark:border-amber-800/40 bg-card p-3 transition-colors hover:border-amber-500"
                  >
                    <div>
                      <p className="font-medium text-xs text-foreground line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.city} · {p.propertyType}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-border">
                      <span className="text-muted-foreground">{p.views} vues</span>
                      <span className="font-semibold text-destructive">{p.requests} demande(s) ({p.conversionRates.viewToRequest}%)</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comprehensive Property Performance Table */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h2 className="font-display text-base text-foreground">Performance des Biens</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agrégation réelle par bien : consultations, enregistrements en favoris, demandes et réservations.
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {topProperties.length} bien(s) analysé(s)
              </span>
            </div>

            {topProperties.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Aucun bien publié pour le moment.</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Logement</th>
                      <th className="p-3 font-semibold">Ville</th>
                      <th className="p-3 font-semibold text-right">Vues</th>
                      <th className="p-3 font-semibold text-right">Favoris</th>
                      <th className="p-3 font-semibold text-right">Demandes</th>
                      <th className="p-3 font-semibold text-right">Propositions</th>
                      <th className="p-3 font-semibold text-right">Réservé</th>
                      <th className="p-3 font-semibold text-right">Taux Vue → Demande</th>
                      <th className="p-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topProperties.map((p) => (
                      <tr key={p.propertyId} className="hover:bg-surface/50 transition-colors">
                        <td className="p-3 font-medium text-foreground max-w-[200px] truncate">
                          {p.title}
                        </td>
                        <td className="p-3 text-muted-foreground">{p.city}</td>
                        <td className="p-3 text-right font-mono font-medium text-foreground">{p.views}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{p.favorites}</td>
                        <td className="p-3 text-right font-mono font-medium text-primary">{p.requests}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{p.proposals}</td>
                        <td className="p-3 text-right">
                          {p.reservations > 0 ? (
                            <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              Réservé
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-medium">
                          <span
                            className={cn(
                              p.conversionRates.viewToRequest >= 15
                                ? "text-emerald-600 dark:text-emerald-400"
                                : p.conversionRates.viewToRequest > 0
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {p.conversionRates.viewToRequest}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Link
                            href={`/admin/properties/${p.propertyId}`}
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-surface hover:text-foreground"
                          >
                            Détail
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function FunnelStep({
  label,
  count,
  icon: Icon,
  conversionRate,
  rateLabel,
  accent,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  conversionRate: number | null | undefined;
  rateLabel?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-3 transition-colors hover:bg-surface/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("rounded-md p-1.5", accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span className={cn("font-display text-base", accent ? "text-primary" : "text-foreground")}>
          {count}
        </span>
      </div>
      {conversionRate !== null && conversionRate !== undefined && (
        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1.5 text-[11px]">
          <span className="text-muted-foreground">{rateLabel || "Conversion"}</span>
          <span className="font-medium text-foreground font-mono">{conversionRate}%</span>
        </div>
      )}
    </div>
  );
}
