"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { AdminStatusBadge } from "@/lib/admin-theme";
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
  AlertTriangle,
  CreditCard,
  ChevronRight,
  PieChart,
  MapPin,
  ChevronLeft,
  Activity,
  Layers,
  Percent,
} from "lucide-react";

interface AdminOverviewData {
  actionNeeded: {
    pendingProperties: number;
    openRequests: number;
    unpaidReservations: number;
  };
  stats: {
    openRequests: number;
    properties: number;
    unverifiedProperties: number;
    dealsCount: number;
    totalMargin: number;
  };
  marketplacePerformance: {
    totalInventory: number;
    publishedProperties: number;
    pausedProperties: number;
    activeRequests: number;
    confirmedReservations: number;
    totalMargin: number;
    conversionRate: number;
  };
  distributions: {
    requestStatus: Record<string, number>;
    paymentStatus: Record<string, number>;
    destinationDemand: Array<{ destination: string; count: number }>;
  };
  propertyPerformance: {
    properties: Array<{
      id: string;
      title: string;
      city: string;
      rentalCategory: string;
      price: number;
      status: string;
      verified: boolean;
      coverImage: string;
      requestCount: number;
      reservationCount: number;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  recentRequests: Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    rentalCategory: string;
    destination: string;
    status: string;
    createdAt: string;
  }>;
  recentProperties: Array<{
    id: string;
    title: string;
    city: string;
    rentalCategory: string;
    price: number;
    status: string;
    verified: boolean;
    createdAt: string;
  }>;
  recentDeals: Array<{
    id: string;
    property: string;
    ownerPrice: number;
    customerOffer: number;
    margin: number;
    closed: string;
  }>;
}

const REQUEST_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Nouvelle demande", color: "bg-amber-500" },
  UNDER_REVIEW: { label: "En cours d'examen", color: "bg-amber-500" },
  PROPERTY_PROPOSED: { label: "Logement proposé", color: "bg-primary" },
  CLIENT_CONFIRMATION: { label: "Attente confirmation", color: "bg-primary" },
  CONFIRMED: { label: "Réservations confirmées", color: "bg-emerald-500" },
  COMPLETED: { label: "Séjours terminés", color: "bg-emerald-600" },
  REJECTED: { label: "Refusées / Non dispo", color: "bg-rose-500" },
  CANCELLED: { label: "Annulées", color: "bg-gray-400" },
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  UNPAID: { label: "Non payé", color: "bg-amber-500" },
  REPORTED: { label: "Paiement déclaré", color: "bg-amber-500" },
  PARTIALLY_PAID: { label: "Partiellement payé", color: "bg-primary" },
  PAID: { label: "Payé / Vérifié", color: "bg-emerald-500" },
  REFUNDED: { label: "Remboursé", color: "bg-rose-500" },
};

export default function AdminHome() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchOverview = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/overview?page=${targetPage}&limit=6`);
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des données d'administration.");
      }
      const json = await res.json();
      setData(json);
      setPage(targetPage);
    } catch (err: any) {
      setError(err.message || "Impossible de charger le tableau de bord d'administration. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(1);
  }, []);

  const actionNeeded = data?.actionNeeded || { pendingProperties: 0, openRequests: 0, unpaidReservations: 0 };
  const stats = data?.stats;
  const marketplace = data?.marketplacePerformance;
  const distributions = data?.distributions;
  const propertyPerf = data?.propertyPerformance;
  const recentRequests = data?.recentRequests || [];
  const recentProperties = data?.recentProperties || [];
  const recentDeals = data?.recentDeals || [];

  const totalActionsCount = actionNeeded.pendingProperties + actionNeeded.openRequests + actionNeeded.unpaidReservations;

  const totalRequestDistCount = distributions?.requestStatus
    ? Object.values(distributions.requestStatus).reduce((a, b) => a + b, 0)
    : 0;

  const totalPaymentDistCount = distributions?.paymentStatus
    ? Object.values(distributions.paymentStatus).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <AdminShell title="Vue d'ensemble" subtitle="Console d'opérations et suivi de la marketplace LOC MAISON">
      <AsyncStateContainer
        isLoading={loading && !data}
        loadingText="Chargement de la console d'opérations…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        isEmpty={false}
        onRetry={() => fetchOverview(page)}
      >
        <div className="space-y-8">
          {/* Operational Urgency Section */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground">À traiter aujourd'hui</h2>
                  <p className="text-xs text-muted-foreground">
                    {totalActionsCount > 0
                      ? `${totalActionsCount} élément(s) requérant une intervention administrative`
                      : "Aucune action urgente en attente."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/admin/properties?status=PENDING_REVIEW"
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 hover:border-amber-500/50 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Biens en attente</span>
                    <p className="text-2xl font-display font-semibold text-foreground mt-1">
                      {actionNeeded.pendingProperties}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-amber-700 dark:text-amber-400 pt-2 border-t border-border/50">
                  <span>Modérer les annonces</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admin/requests"
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 hover:border-primary/50 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Demandes ouvertes</span>
                    <p className="text-2xl font-display font-semibold text-primary mt-1">
                      {actionNeeded.openRequests}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary-soft p-2 text-primary border border-primary/20">
                    <Inbox className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-primary pt-2 border-t border-border/50">
                  <span>Traiter les réservations</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admin/requests"
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 hover:border-rose-500/50 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Paiements à vérifier</span>
                    <p className="text-2xl font-display font-semibold text-foreground mt-1">
                      {actionNeeded.unpaidReservations}
                    </p>
                  </div>
                  <div className="rounded-lg bg-rose-500/10 p-2 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-rose-700 dark:text-rose-400 pt-2 border-t border-border/50">
                  <span>Vérifier les règlements</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* Core KPI Metrics (Performance Overview style) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Vue d'ensemble des Performances</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Active Listings (Soft Sky Blue) */}
              <Link
                href="/admin/properties"
                className="group relative rounded-2xl border border-sky-200/80 bg-sky-50/90 dark:bg-sky-950/30 dark:border-sky-900/50 p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">Biens enregistrés</span>
                    <p className="text-2xl font-display font-bold text-sky-950 dark:text-sky-100 mt-1">
                      {stats?.properties ?? 0} <span className="text-xs font-medium text-sky-700 dark:text-sky-300">Biens</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-sky-200/70 p-2 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[0.7rem] pt-2 border-t border-sky-200/60 dark:border-sky-900/40">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-200/80 dark:bg-sky-900/80 px-2 py-0.5 font-semibold text-sky-900 dark:text-sky-200">
                    +1 cette semaine
                  </span>
                  <span className="text-sky-700 dark:text-sky-400 font-medium group-hover:underline">Voir les biens →</span>
                </div>
              </Link>

              {/* Card 2: Pending Approvals (Soft Amber) */}
              <Link
                href="/admin/properties?status=PENDING_REVIEW"
                className="group relative rounded-2xl border border-amber-200/80 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-900/50 p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">En attente de validation</span>
                    <p className="text-2xl font-display font-bold text-amber-950 dark:text-amber-100 mt-1">
                      {actionNeeded.pendingProperties} <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Biens</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-200/70 p-2 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[0.7rem] pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 font-bold text-amber-900 dark:text-amber-200">
                    85% Taux de validation
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium group-hover:underline">Examiner →</span>
                </div>
              </Link>

              {/* Card 3: New Inquiries (Soft Emerald Green) */}
              <Link
                href="/admin/requests"
                className="group relative rounded-2xl border border-emerald-200/80 bg-emerald-50/90 dark:bg-emerald-950/30 dark:border-emerald-900/50 p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Demandes de logement</span>
                    <p className="text-2xl font-display font-bold text-emerald-950 dark:text-emerald-100 mt-1">
                      {stats?.openRequests ?? 0} <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Demandes</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-200/70 p-2 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <Inbox className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[0.7rem] pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 px-2 py-0.5 font-semibold text-emerald-900 dark:text-emerald-200">
                    +3 récents aujourd'hui
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium group-hover:underline">Traiter →</span>
                </div>
              </Link>

              {/* Card 4: Total Revenue & Margin (Soft Purple) */}
              <div className="group relative rounded-2xl border border-purple-200/80 bg-purple-50/90 dark:bg-purple-950/30 dark:border-purple-900/50 p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">Marge Cumulée</span>
                    <p className="text-2xl font-display font-bold text-purple-950 dark:text-purple-100 mt-1">
                      {formatDT(stats?.totalMargin ?? 0)} DT
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-200/70 p-2 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[0.7rem] pt-2 border-t border-purple-200/60 dark:border-purple-900/40">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-200/80 dark:bg-purple-900/80 px-2 py-0.5 font-semibold text-purple-900 dark:text-purple-200">
                    +12% ce mois
                  </span>
                  <span className="text-purple-700 dark:text-purple-400 font-medium font-mono">{stats?.dealsCount ?? 0} contrats</span>
                </div>
              </div>
            </div>
          </div>

          {/* Marketplace Performance Intelligence Layer */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary-soft p-2 text-primary border border-primary/20">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground">Performance du Marketplace</h2>
                  <p className="text-xs text-muted-foreground">
                    Indicateurs clés d'inventaire, de conversion et de rentabilité globale
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Inventaire Total</span>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-display font-semibold text-foreground mt-1">
                  {marketplace?.totalInventory ?? 0} biens
                </p>
                <div className="mt-2 text-[0.75rem] text-muted-foreground flex items-center gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    {marketplace?.publishedProperties ?? 0} publiés
                  </span>
                  <span>•</span>
                  <span>{marketplace?.pausedProperties ?? 0} en pause</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Demandes Actives</span>
                  <Inbox className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl font-display font-semibold text-primary mt-1">
                  {marketplace?.activeRequests ?? 0} en cours
                </p>
                <p className="mt-2 text-[0.75rem] text-muted-foreground">
                  Demandes client non clôturées
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Taux de Conversion</span>
                  <Percent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xl font-display font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                  {marketplace?.conversionRate ?? 0}%
                </p>
                <p className="mt-2 text-[0.75rem] text-muted-foreground">
                  Demandes converties en contrats
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Marge Cumulée</span>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl font-display font-semibold text-foreground mt-1">
                  {formatDT(marketplace?.totalMargin ?? 0)} DT
                </p>
                <p className="mt-2 text-[0.75rem] text-muted-foreground">
                  Commission nette enregistrée
                </p>
              </div>
            </div>
          </div>

          {/* Distributions */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Request Status Distribution */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Statuts des Demandes
                </h2>
                <span className="text-xs font-mono font-semibold text-primary">{totalRequestDistCount} total</span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-surface overflow-hidden flex border border-border/40">
                {distributions?.requestStatus &&
                  Object.entries(distributions.requestStatus).map(([statusKey, count]) => {
                    if (count === 0 || totalRequestDistCount === 0) return null;
                    const pct = (count / totalRequestDistCount) * 100;
                    const meta = REQUEST_STATUS_LABELS[statusKey] || { color: "bg-gray-400" };
                    return (
                      <div
                        key={statusKey}
                        className={`${meta.color} h-full transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${meta.label}: ${count} (${Math.round(pct)}%)`}
                      />
                    );
                  })}
              </div>

              <div className="space-y-2 pt-1 text-xs">
                {distributions?.requestStatus &&
                  Object.entries(distributions.requestStatus).map(([statusKey, count]) => {
                    const meta = REQUEST_STATUS_LABELS[statusKey] || { label: statusKey, color: "bg-gray-400" };
                    const pct = totalRequestDistCount > 0 ? Math.round((count / totalRequestDistCount) * 100) : 0;
                    return (
                      <div key={statusKey} className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${meta.color}`} />
                          <span className="truncate max-w-[150px]">{meta.label}</span>
                        </div>
                        <span className="font-mono font-medium text-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Payment Status Distribution */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Statut des Règlements
                </h2>
                <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">{totalPaymentDistCount} réservations</span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-surface overflow-hidden flex border border-border/40">
                {distributions?.paymentStatus &&
                  Object.entries(distributions.paymentStatus).map(([statusKey, count]) => {
                    if (count === 0 || totalPaymentDistCount === 0) return null;
                    const pct = (count / totalPaymentDistCount) * 100;
                    const meta = PAYMENT_STATUS_LABELS[statusKey] || { color: "bg-gray-400" };
                    return (
                      <div
                        key={statusKey}
                        className={`${meta.color} h-full transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${meta.label}: ${count} (${Math.round(pct)}%)`}
                      />
                    );
                  })}
              </div>

              <div className="space-y-2 pt-1 text-xs">
                {distributions?.paymentStatus &&
                  Object.entries(distributions.paymentStatus).map(([statusKey, count]) => {
                    const meta = PAYMENT_STATUS_LABELS[statusKey] || { label: statusKey, color: "bg-gray-400" };
                    const pct = totalPaymentDistCount > 0 ? Math.round((count / totalPaymentDistCount) * 100) : 0;
                    return (
                      <div key={statusKey} className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${meta.color}`} />
                          <span>{meta.label}</span>
                        </div>
                        <span className="font-mono font-medium text-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Destinations Demand */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Destinations les plus demandées
                </h2>
              </div>

              <div className="space-y-2 text-xs">
                {distributions?.destinationDemand && distributions.destinationDemand.length > 0 ? (
                  distributions.destinationDemand.map((d, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface/50 border border-border/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-[0.65rem]">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-foreground">{d.destination}</span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border">
                        {d.count} demande(s)
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Aucune donnée disponible.</p>
                )}
              </div>
            </div>
          </div>

          {/* Performance des Biens (Visual Inventory Grid with Pagination) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Performance & Inventaire Visuel des Biens
                </h2>
                <p className="text-xs text-muted-foreground">
                  Aperçu des biens au catalogue avec attribution des demandes & réservations
                </p>
              </div>

              {propertyPerf?.pagination && propertyPerf.pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchOverview(page - 1)}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Précédent
                  </button>
                  <span className="text-xs font-mono font-semibold text-muted-foreground px-1">
                    {page} / {propertyPerf.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchOverview(page + 1)}
                    disabled={page >= propertyPerf.pagination.totalPages || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {propertyPerf?.properties && propertyPerf.properties.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {propertyPerf.properties.map((p) => (
                  <div
                    key={p.id}
                    className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-2xs hover:border-primary/50 transition-all"
                  >
                    <div>
                      {/* Property Cover Image */}
                      <div className="relative h-40 w-full rounded-xl bg-surface overflow-hidden border border-border/60">
                        {p.coverImage ? (
                          <img
                            src={p.coverImage}
                            alt={p.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface text-muted-foreground">
                            <Building2 className="h-10 w-10 stroke-1 opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5">
                          <AdminStatusBadge status={p.status} showDot />
                        </div>
                        <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/80 backdrop-blur-xs px-2.5 py-1 text-xs font-mono font-bold text-white shadow-2xs">
                          {formatDT(p.price)} DT
                        </div>
                      </div>

                      {/* Title & Location */}
                      <div className="mt-3.5 space-y-1">
                        <h3 className="font-display text-sm font-bold text-foreground line-clamp-1" title={p.title}>
                          {p.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-medium text-foreground">{p.city}</span>
                          <span>•</span>
                          <span className="capitalize">{p.rentalCategory === "summer" ? "Vacances" : "Étudiant"}</span>
                        </div>
                      </div>

                      {/* 3 Metric Stat Pills Row */}
                      <div className="mt-3.5 grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className="rounded-xl bg-surface/70 p-2 border border-border/60">
                          <span className="text-[0.65rem] text-muted-foreground block font-medium">Demandes</span>
                          <span className="font-mono font-bold text-primary text-xs">{p.requestCount}</span>
                        </div>
                        <div className="rounded-xl bg-surface/70 p-2 border border-border/60">
                          <span className="text-[0.65rem] text-muted-foreground block font-medium">Réservations</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            {p.reservationCount}
                          </span>
                        </div>
                        <div className="rounded-xl bg-surface/70 p-2 border border-border/60">
                          <span className="text-[0.65rem] text-muted-foreground block font-medium">Ajouté</span>
                          <span className="font-mono text-[0.7rem] text-foreground font-semibold truncate block">
                            {p.createdAt || "Récents"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Action Buttons at Bottom of Card (Separate data destinations) */}
                    <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/properties/${p.id}#owner`}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-2 text-[0.75rem] font-semibold text-foreground hover:bg-card hover:border-primary/50 transition-colors text-center"
                        title="Voir la fiche propriétaire, les clients et le statut de paiement"
                      >
                        <span>Données & Clients</span>
                      </Link>
                      <Link
                        href={`/admin/properties/${p.id}#analytics`}
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-2.5 py-2 text-[0.75rem] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors text-center shadow-2xs"
                        title="Voir les statistiques de vue, conversions et performances"
                      >
                        <span>Voir Performance</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
                <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">Aucun bien disponible</p>
              </div>
            )}
          </div>

          {/* Operational Tables: Recent Demandes & Recent Biens */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Demandes récents */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground">Demandes de logement récentes</h2>
                <Link
                  href="/admin/requests"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Tout voir <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
                  <Inbox className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-xs font-semibold text-foreground">Aucune demande enregistrée</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                      <tr>
                        <th className="p-3">Client</th>
                        <th className="p-3">Destination</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                          <td className="p-3 font-medium text-foreground">
                            <div>{r.customerName}</div>
                            <div className="text-[0.7rem] text-muted-foreground font-mono">{r.customerPhone}</div>
                          </td>
                          <td className="p-3 text-muted-foreground">{r.destination}</td>
                          <td className="p-3"><AdminStatusBadge status={r.status} showDot /></td>
                          <td className="p-3 text-muted-foreground">{r.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Biens récents */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground">Derniers biens soumis</h2>
                <Link
                  href="/admin/properties"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Tout voir <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
                  <Building2 className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-xs font-semibold text-foreground">Aucun bien enregistré</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                      <tr>
                        <th className="p-3">Titre du bien</th>
                        <th className="p-3">Ville</th>
                        <th className="p-3">Prix</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentProperties.map((p) => (
                        <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                          <td className="p-3 font-medium text-foreground truncate max-w-[140px]" title={p.title}>
                            {p.title}
                          </td>
                          <td className="p-3 text-muted-foreground">{p.city}</td>
                          <td className="p-3 font-semibold text-foreground">{formatDT(p.price)} DT</td>
                          <td className="p-3"><AdminStatusBadge status={p.status} showDot /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Deals Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">Derniers Contrats & Transactions</h2>
              <Link href="/admin/requests" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Voir toutes les transactions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <FileText className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Aucun contrat récent</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les réservations confirmées et conclues avec commission apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface/60 font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
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
                        <td className="p-3.5 font-mono text-xs font-semibold text-primary">{d.id}</td>
                        <td className="p-3.5 font-medium text-foreground">{d.property}</td>
                        <td className="p-3.5 text-xs text-muted-foreground">{formatDT(d.ownerPrice)} DT</td>
                        <td className="p-3.5 text-xs text-muted-foreground">{formatDT(d.customerOffer)} DT</td>
                        <td className="p-3.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">{formatDT(d.margin)} DT</td>
                        <td className="p-3.5 text-xs text-muted-foreground">{d.closed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Admin Actions Grid */}
          <div className="pt-2">
            <h2 className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Accès rapide</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
              <Link
                href="/admin/requests"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition-all shadow-2xs group"
              >
                <div className="rounded-lg bg-primary-soft p-2 text-primary border border-primary/20">
                  <Inbox className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-foreground block truncate">Traiter demandes</span>
                  <span className="text-[0.65rem] text-muted-foreground hidden sm:block">Réservations</span>
                </div>
              </Link>

              <Link
                href="/admin/properties"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition-all shadow-2xs group"
              >
                <div className="rounded-lg bg-surface p-2 text-muted-foreground border border-border">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-foreground block truncate">Modérer biens</span>
                  <span className="text-[0.65rem] text-muted-foreground hidden sm:block">Modération</span>
                </div>
              </Link>

              <Link
                href="/admin/clients"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition-all shadow-2xs group"
              >
                <div className="rounded-lg bg-surface p-2 text-muted-foreground border border-border">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-foreground block truncate">Gérer clients</span>
                  <span className="text-[0.65rem] text-muted-foreground hidden sm:block">Comptes</span>
                </div>
              </Link>

              <Link
                href="/admin/analytics"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition-all shadow-2xs group"
              >
                <div className="rounded-lg bg-primary-soft p-2 text-primary border border-primary/20">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-foreground block truncate">Statistiques</span>
                  <span className="text-[0.65rem] text-muted-foreground hidden sm:block">Performances</span>
                </div>
              </Link>

              <Link
                href="/admin/activities"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition-all shadow-2xs group"
              >
                <div className="rounded-lg bg-surface p-2 text-muted-foreground border border-border">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-foreground block truncate">Activités</span>
                  <span className="text-[0.65rem] text-muted-foreground hidden sm:block">Journal</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </AsyncStateContainer>
    </AdminShell>
  );
}
