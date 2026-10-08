"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import type { AdminAnalyticsOverview, PropertyPerformance } from "@/lib/analytics/types";
import { LoadingThreeDotsJumping } from "@/components/shared/LoadingThreeDotsJumping";
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
        className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:p-5"
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
                Sélectionnez la plage temporelle des métriques d'exploitation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card transition-colors disabled:opacity-50"
            title="Rafraîchir les statistiques"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-primary", loading && "animate-spin")} />
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
                "flex items-center justify-center rounded-lg border px-3 py-2 text-center text-xs font-medium transition-all",
                period === p.id
                  ? "border-primary bg-primary-soft text-primary font-semibold shadow-2xs"
                  : "border-border bg-surface text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-16 text-center shadow-2xs min-h-[300px]">
          <LoadingThreeDotsJumping text="Agrégation des métriques en temps réel…" size="md" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 p-10 text-center">
          <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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
              hint="Sessions totales"
            />
            <StatCard
              label="Recherches"
              value={String(stats?.searches ?? 0)}
              hint="Requêtes soumises"
            />
            <StatCard
              label="Vues de biens"
              value={String(stats?.propertyViews ?? 0)}
              hint="Fiches consultées"
            />
            <StatCard
              label="Demandes formulées"
              value={String(stats?.requests ?? 0)}
              accent
              hint="Dossiers déposés"
            />
            <StatCard
              label="Propositions envoyées"
              value={String(stats?.proposals ?? 0)}
              hint={`${stats?.acceptedProposals ?? 0} acceptée(s)`}
            />
            <StatCard
              label="Réservations"
              value={String(stats?.reservations ?? 0)}
              accent
              hint="Contrats conclus"
            />
          </div>

          {/* Customer Funnel & Owner Funnel Grids */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Customer Funnel */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-sm font-bold text-foreground">Entonnoir Client (Demande)</h2>
                </div>
                <span className="text-xs font-mono text-muted-foreground">Taux de conversion</span>
              </div>

              <div className="space-y-3">
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
                  rateLabel="des demandes reçoivent une offre"
                />
                <FunnelStep
                  label="6. Réservations conclues"
                  count={customerFunnel?.reservations ?? 0}
                  icon={CalendarCheck}
                  accent
                  conversionRate={customerFunnel?.conversions?.proposalToReservation}
                  rateLabel="des offres aboutissent à un contrat"
                />
              </div>
            </div>

            {/* Owner Funnel & Demand vs Supply */}
            <div className="space-y-6">
              {/* Owner Funnel */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-sm font-bold text-foreground">Entonnoir Propriétaire (Offre)</h2>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Inventaire</span>
                </div>

                <div className="space-y-3">
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
              <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Tension Marché : Demande vs Offre</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Comparatif des recherches et des biens publiés par ville
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  {demandVsSupply.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune donnée de localisation disponible.</p>
                  ) : (
                    demandVsSupply.map((d) => (
                      <div
                        key={d.city}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/60 p-3"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{d.city}</p>
                          <p className="text-muted-foreground text-[0.7rem] mt-0.5">
                            {d.searches} recherche(s) · {d.requests} demande(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{d.availableProperties} bien(s) publié(s)</p>
                          <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700 dark:text-amber-400 mt-1 border border-amber-500/20">
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
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-2xs space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Biens à forte visibilité mais faible conversion
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Ces annonces génèrent du trafic mais peu de réservations. Une revue du prix ou des visuels est recommandée.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowConversion.map((p) => (
                  <Link
                    key={p.propertyId}
                    href={`/admin/properties/${p.propertyId}`}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:border-amber-500/60 shadow-2xs"
                  >
                    <div>
                      <p className="font-semibold text-xs text-foreground line-clamp-1">{p.title}</p>
                      <p className="text-[0.7rem] text-muted-foreground mt-0.5">{p.city} · {p.propertyType}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-border/50">
                      <span className="text-muted-foreground text-[0.7rem]">{p.views} vues</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400 text-[0.75rem]">{p.requests} demande(s) ({p.conversionRates.viewToRequest}%)</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comprehensive Property Performance Table */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">Performance Détaillée des Biens</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agrégation réelle par bien : consultations, favoris, demandes et conversion
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                {topProperties.length} bien(s) analysé(s)
              </span>
            </div>

            {topProperties.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Aucun bien publié pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Logement</th>
                      <th className="p-3.5">Ville</th>
                      <th className="p-3.5 text-right">Vues</th>
                      <th className="p-3.5 text-right">Favoris</th>
                      <th className="p-3.5 text-right">Demandes</th>
                      <th className="p-3.5 text-right">Propositions</th>
                      <th className="p-3.5 text-right">Réservé</th>
                      <th className="p-3.5 text-right">Taux Conversion</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topProperties.map((p) => (
                      <tr key={p.propertyId} className="hover:bg-surface/50 transition-colors">
                        <td className="p-3.5 font-semibold text-foreground max-w-[200px] truncate">
                          {p.title}
                        </td>
                        <td className="p-3.5 text-muted-foreground">{p.city}</td>
                        <td className="p-3.5 text-right font-mono font-semibold text-foreground">{p.views}</td>
                        <td className="p-3.5 text-right font-mono text-muted-foreground">{p.favorites}</td>
                        <td className="p-3.5 text-right font-mono font-semibold text-primary">{p.requests}</td>
                        <td className="p-3.5 text-right font-mono text-muted-foreground">{p.proposals}</td>
                        <td className="p-3.5 text-right">
                          {p.reservations > 0 ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              Oui ({p.reservations})
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono font-semibold">
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
                        <td className="p-3.5 text-center">
                          <Link
                            href={`/admin/properties/${p.propertyId}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface hover:border-primary/50 transition-colors"
                          >
                            Fiche <ArrowUpRight className="h-3 w-3 text-primary" />
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
    <div className="rounded-xl border border-border/60 bg-surface/50 p-3 transition-colors hover:bg-surface">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("rounded-md p-1.5", accent ? "bg-primary-soft text-primary" : "bg-card text-muted-foreground border border-border")}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span className={cn("font-mono text-sm font-semibold", accent ? "text-primary" : "text-foreground")}>
          {count}
        </span>
      </div>
      {conversionRate !== null && conversionRate !== undefined && (
        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1.5 text-[0.7rem]">
          <span className="text-muted-foreground">{rateLabel || "Conversion"}</span>
          <span className="font-mono font-semibold text-foreground">{conversionRate}%</span>
        </div>
      )}
    </div>
  );
}
