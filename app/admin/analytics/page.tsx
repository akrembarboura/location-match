"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminAnalyticsOverview, PropertyPerformance } from "@/lib/analytics/types";
import { LoadingThreeDotsJumping } from "@/components/shared/LoadingThreeDotsJumping";
import {
  TrendingUp,
  Users,
  Search,
  Eye,
  FileCheck,
  CalendarCheck,
  Building,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";

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
  const [isMounted, setIsMounted] = useState(false);

  // Property Table Search & Pagination
  const [propSearch, setPropSearch] = useState("");
  const [propPage, setPropPage] = useState(1);
  const propPageSize = 10;

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Recharts Data Mapping: Activity Breakdown Bar Chart
  const activityData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Visiteurs", count: stats.visitors, color: "#3b82f6" },
      { name: "Recherches", count: stats.searches, color: "#6366f1" },
      { name: "Vues Biens", count: stats.propertyViews, color: "#8b5cf6" },
      { name: "Demandes", count: stats.requests, color: "#059669" },
      { name: "Propositions", count: stats.proposals, color: "#d97706" },
      { name: "Réservations", count: stats.reservations, color: "#10b981" },
    ];
  }, [stats]);

  // Recharts Data Mapping: Demand vs Supply Grouped Bar Chart
  const cityData = useMemo(() => {
    if (!demandVsSupply || demandVsSupply.length === 0) return [];
    return demandVsSupply.map((item) => ({
      city: item.city,
      Recherches: item.searches,
      Demandes: item.requests,
      Offre: item.availableProperties,
    }));
  }, [demandVsSupply]);

  // Filtered property performance
  const filteredProperties = useMemo(() => {
    return topProperties.filter(
      (p) =>
        p.title.toLowerCase().includes(propSearch.toLowerCase()) ||
        p.city.toLowerCase().includes(propSearch.toLowerCase())
    );
  }, [topProperties, propSearch]);

  const totalPropPages = Math.ceil(filteredProperties.length / propPageSize) || 1;
  const paginatedProperties = useMemo(() => {
    const start = (propPage - 1) * propPageSize;
    return filteredProperties.slice(start, start + propPageSize);
  }, [filteredProperties, propPage, propPageSize]);

  return (
    <AdminShell
      title="Analytics"
      subtitle="Suivez le trafic, la demande et la performance de la plateforme."
    >
      {/* Header & Date Range Controls */}
      <section
        aria-labelledby="analytics-period-heading"
        className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-soft p-2 text-primary border border-primary/20">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="analytics-period-heading" className="font-display text-sm font-bold text-foreground">
                Période d’analyse
              </h2>
              <p className="text-xs text-muted-foreground">
                Plage temporelle appliquée à l'ensemble des graphiques et indicateurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div role="group" aria-label="Période" className="flex items-center rounded-lg border border-border bg-surface p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={period === p.id}
                  onClick={() => {
                    setPeriod(p.id);
                    setPropPage(1);
                  }}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                    period === p.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fetchAnalytics(period)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card transition-colors disabled:opacity-50"
              title="Rafraîchir les métriques"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 text-primary", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-2xs">
          <LoadingThreeDotsJumping text="Chargement des graphiques et métriques analytiques…" size="md" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
          <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Row 2: Compact KPI Summary Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[0.7rem] font-medium text-muted-foreground block">Visiteurs uniques</span>
              <span className="font-display text-xl font-bold text-black dark:text-white mt-1 block">
                {stats?.visitors ?? 0}
              </span>
              <span className="text-[0.65rem] text-muted-foreground block mt-0.5">Sessions identifiées</span>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[0.7rem] font-medium text-muted-foreground block">Recherches</span>
              <span className="font-display text-xl font-bold text-black dark:text-white mt-1 block">
                {stats?.searches ?? 0}
              </span>
              <span className="text-[0.65rem] text-muted-foreground block mt-0.5">Filtres soumis</span>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[0.7rem] font-medium text-muted-foreground block">Vues de biens</span>
              <span className="font-display text-xl font-bold text-black dark:text-white mt-1 block">
                {stats?.propertyViews ?? 0}
              </span>
              <span className="text-[0.65rem] text-muted-foreground block mt-0.5">Fiches consultées</span>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[0.7rem] font-medium text-muted-foreground block">Demandes</span>
              <span className="font-display text-xl font-bold text-black dark:text-white mt-1 block">
                {stats?.requests ?? 0}
              </span>
              <span className="text-[0.65rem] text-muted-foreground block mt-0.5">Dossiers déposés</span>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[0.7rem] font-medium text-muted-foreground block">Propositions</span>
              <span className="font-display text-xl font-bold text-black dark:text-white mt-1 block">
                {stats?.proposals ?? 0}
              </span>
              <span className="text-[0.65rem] text-muted-foreground block mt-0.5">{stats?.acceptedProposals ?? 0} acceptée(s)</span>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[0.7rem] font-medium text-muted-foreground block">Réservations</span>
              <span className="font-display text-xl font-bold text-black dark:text-white mt-1 block">
                {stats?.reservations ?? 0}
              </span>
              <span className="text-[0.65rem] text-muted-foreground block mt-0.5">Contrats conclus</span>
            </div>
          </div>

          {/* Row 3: Charts Grid (Activity Bar Chart + Demand vs Supply Chart) */}
          <div className="grid gap-5 lg:grid-cols-2 items-start">
            {/* Mandatory Bar Chart — Activity Breakdown */}
            <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    Répartition de l'Activité (Bar Chart)
                  </h3>
                </div>
                <span className="text-[0.7rem] font-mono text-muted-foreground">Volume par étape</span>
              </div>

              {isMounted && activityData.length > 0 ? (
                <div className="h-[260px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
                  Aucune donnée d'activité disponible pour cette période.
                </div>
              )}
            </div>

            {/* Demand vs Supply Grouped Bar Chart */}
            <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    Tension du Marché (Demande vs Offre)
                  </h3>
                </div>
                <span className="text-[0.7rem] font-mono text-muted-foreground">Par ville</span>
              </div>

              {isMounted && cityData.length > 0 ? (
                <div className="h-[260px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                      <XAxis dataKey="city" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="Recherches" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Demandes" fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Offre" fill="#d97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
                  Aucune donnée de ville disponible.
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Funnel Steps & Owner Conversion Summary */}
          <div className="grid gap-5 lg:grid-cols-2 items-start">
            {/* Customer Conversion Funnel */}
            <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    Entonnoir de Conversion Client
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {customerFunnel?.conversions?.viewToRequest ?? 0}% conversion vues ➔ demandes
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <FunnelStepItem
                  label="1. Visiteurs"
                  count={customerFunnel?.visitors ?? 0}
                  totalMax={customerFunnel?.visitors || 1}
                  conversionRate={null}
                  color="bg-blue-500"
                />
                <FunnelStepItem
                  label="2. Recherches"
                  count={customerFunnel?.searches ?? 0}
                  totalMax={customerFunnel?.visitors || 1}
                  conversionRate={customerFunnel?.conversions?.visitorToSearch}
                  rateLabel="des visiteurs cherchent"
                  color="bg-indigo-500"
                />
                <FunnelStepItem
                  label="3. Vues de biens"
                  count={customerFunnel?.propertyViews ?? 0}
                  totalMax={customerFunnel?.visitors || 1}
                  conversionRate={customerFunnel?.conversions?.searchToView}
                  rateLabel="mènent à une consultation"
                  color="bg-purple-500"
                />
                <FunnelStepItem
                  label="4. Demandes"
                  count={customerFunnel?.requests ?? 0}
                  totalMax={customerFunnel?.visitors || 1}
                  conversionRate={customerFunnel?.conversions?.viewToRequest}
                  rateLabel="convertissent en dossier"
                  color="bg-emerald-500"
                  accent
                />
                <FunnelStepItem
                  label="5. Propositions"
                  count={customerFunnel?.proposals ?? 0}
                  totalMax={customerFunnel?.visitors || 1}
                  conversionRate={customerFunnel?.conversions?.requestToProposal}
                  rateLabel="reçoivent une offre"
                  color="bg-amber-500"
                />
                <FunnelStepItem
                  label="6. Réservations"
                  count={customerFunnel?.reservations ?? 0}
                  totalMax={customerFunnel?.visitors || 1}
                  conversionRate={customerFunnel?.conversions?.proposalToReservation}
                  rateLabel="aboutissent à un contrat"
                  color="bg-teal-500"
                  accent
                />
              </div>
            </div>

            {/* Owner Inventory Funnel */}
            <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    Entonnoir Propriétaire (Offre)
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  Inventaire
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <FunnelStepItem
                  label="1. Clics CTA Propriétaire"
                  count={ownerFunnel?.ctaClicks ?? 0}
                  totalMax={ownerFunnel?.ctaClicks || 1}
                  conversionRate={null}
                  color="bg-slate-500"
                />
                <FunnelStepItem
                  label="2. Comptes créés"
                  count={ownerFunnel?.signups ?? 0}
                  totalMax={ownerFunnel?.ctaClicks || 1}
                  conversionRate={ownerFunnel?.conversions?.ctaToSignup}
                  rateLabel="s'inscrivent"
                  color="bg-blue-500"
                />
                <FunnelStepItem
                  label="3. Biens créés"
                  count={ownerFunnel?.propertiesCreated ?? 0}
                  totalMax={ownerFunnel?.ctaClicks || 1}
                  conversionRate={ownerFunnel?.conversions?.signupToCreated}
                  rateLabel="créent au moins 1 bien"
                  color="bg-indigo-500"
                />
                <FunnelStepItem
                  label="4. Biens soumis"
                  count={ownerFunnel?.propertiesSubmitted ?? 0}
                  totalMax={ownerFunnel?.ctaClicks || 1}
                  conversionRate={ownerFunnel?.conversions?.createdToSubmitted}
                  rateLabel="soumettent pour validation"
                  color="bg-amber-500"
                />
                <FunnelStepItem
                  label="5. Biens validés & publiés"
                  count={ownerFunnel?.propertiesApproved ?? 0}
                  totalMax={ownerFunnel?.ctaClicks || 1}
                  conversionRate={ownerFunnel?.conversions?.submittedToApproved}
                  rateLabel="validés par la modération"
                  color="bg-emerald-500"
                  accent
                />
              </div>
            </div>
          </div>

          {/* Low Conversion Callouts */}
          {lowConversion.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-2xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    Biens à forte visibilité mais faible conversion
                  </h3>
                  <p className="text-[0.72rem] text-muted-foreground mt-0.5">
                    Annonces générant des vues mais peu de dossiers. Une révision tarifaire ou visuelle est suggérée.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowConversion.map((p) => (
                  <Link
                    key={p.propertyId}
                    href={`/admin/properties/${p.propertyId}`}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 transition-all hover:border-amber-500/60 shadow-2xs"
                  >
                    <div>
                      <p className="font-semibold text-xs text-foreground line-clamp-1">{p.title}</p>
                      <p className="text-[0.7rem] text-muted-foreground mt-0.5">{p.city} · {p.propertyType}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-border/50">
                      <span className="text-muted-foreground text-[0.7rem]">{p.views} vues</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400 text-[0.72rem]">
                        {p.requests} demande(s) ({p.conversionRates.viewToRequest}%)
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Row 5: Detailed Property Performance Table */}
          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">Performance Détaillée des Biens</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analyse d'audience et de conversion par annonce publiée
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filtrer par titre ou ville..."
                    value={propSearch}
                    onChange={(e) => {
                      setPropSearch(e.target.value);
                      setPropPage(1);
                    }}
                    className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <span className="text-xs font-mono font-semibold text-muted-foreground whitespace-nowrap">
                  {filteredProperties.length} bien(s)
                </span>
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground italic">
                Aucun bien ne correspond aux filtres de recherche.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/80 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3">Logement</th>
                      <th className="p-3">Ville</th>
                      <th className="p-3 text-right">Vues</th>
                      <th className="p-3 text-right">Favoris</th>
                      <th className="p-3 text-right">Demandes</th>
                      <th className="p-3 text-right">Propositions</th>
                      <th className="p-3 text-right">Réservé</th>
                      <th className="p-3 text-right">Taux Conversion</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedProperties.map((p) => (
                      <tr key={p.propertyId} className="hover:bg-surface/60 transition-colors">
                        <td className="p-3 font-semibold text-foreground max-w-[200px] truncate">
                          {p.title}
                        </td>
                        <td className="p-3 text-muted-foreground">{p.city}</td>
                        <td className="p-3 text-right font-mono font-semibold text-foreground">{p.views}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{p.favorites}</td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">{p.requests}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{p.proposals}</td>
                        <td className="p-3 text-right">
                          {p.reservations > 0 ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              Oui ({p.reservations})
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">
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

            {/* Pagination Controls */}
            {filteredProperties.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                <div>
                  Page <strong className="text-foreground">{propPage}</strong> sur{" "}
                  <strong className="text-foreground">{totalPropPages}</strong> ({filteredProperties.length} résultats)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPropPage((p) => Math.max(1, p - 1))}
                    disabled={propPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 transition-colors shadow-2xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropPage((p) => Math.min(totalPropPages, p + 1))}
                    disabled={propPage === totalPropPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 transition-colors shadow-2xs"
                  >
                    Suivant <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function FunnelStepItem({
  label,
  count,
  totalMax,
  conversionRate,
  rateLabel,
  color,
  accent,
}: {
  label: string;
  count: number;
  totalMax: number;
  conversionRate: number | null | undefined;
  rateLabel?: string;
  color: string;
  accent?: boolean;
}) {
  const percent = Math.min(100, Math.round((count / (totalMax || 1)) * 100));

  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-2.5 space-y-1.5 transition-colors hover:bg-surface">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-mono font-bold text-sm text-black dark:text-white">
          {count}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-border/50 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.max(3, percent)}%` }}
        />
      </div>

      {conversionRate !== null && conversionRate !== undefined && (
        <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground pt-0.5">
          <span>{rateLabel}</span>
          <span className="font-mono font-semibold text-black dark:text-white">{conversionRate}%</span>
        </div>
      )}
    </div>
  );
}
