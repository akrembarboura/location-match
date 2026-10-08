"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { AdminStatusBadge } from "@/lib/admin-theme";
import {
  Activity,
  Bell,
  ShieldCheck,
  Inbox,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  category: "NOTIFICATION" | "MODERATION" | "AUDIT" | "REQUEST";
  title: string;
  message: string;
  timestamp: string;
  displayDate: string;
  type: string;
  read?: boolean;
}

interface ActivitiesResponse {
  activities: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CATEGORY_TABS = [
  { id: "all", label: "Toutes les activités" },
  { id: "notifications", label: "Notifications" },
  { id: "moderation", label: "Modération annonces" },
  { id: "requests", label: "Demandes de logement" },
];

function getCategoryBadge(category: string) {
  switch (category) {
    case "NOTIFICATION":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[0.7rem] font-medium bg-primary-soft text-primary border border-primary/20">
          <Bell className="h-3 w-3" /> Notification
        </span>
      );
    case "MODERATION":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[0.7rem] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <ShieldCheck className="h-3 w-3" /> Modération
        </span>
      );
    case "REQUEST":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[0.7rem] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <Inbox className="h-3 w-3" /> Demande
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[0.7rem] font-medium bg-surface text-muted-foreground border border-border">
          <Activity className="h-3 w-3" /> Système
        </span>
      );
  }
}

export default function AdminActivitiesPage() {
  const [data, setData] = useState<ActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);

  const fetchActivities = async (targetType = filterType, targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/activities?type=${targetType}&page=${targetPage}&limit=15`);
      if (!res.ok) {
        throw new Error("Impossible de charger le journal des activités du système.");
      }
      const json = await res.json();
      setData(json);
      setFilterType(targetType);
      setPage(targetPage);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des activités.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities("all", 1);
  }, []);

  const handleTabChange = (newType: string) => {
    fetchActivities(newType, 1);
  };

  const activities = data?.activities || [];
  const pagination = data?.pagination;

  return (
    <AdminShell
      title="Activités du Système"
      subtitle="Journal d'exploitation en temps réel, modérations et notifications"
    >
      <AsyncStateContainer
        isLoading={loading && !data}
        loadingText="Chargement du journal des activités…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        isEmpty={false}
        onRetry={() => fetchActivities(filterType, page)}
      >
        <div className="space-y-6">
          {/* Controls & Filter bar */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary-soft p-2 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground">Journal d'activités</h2>
                  <p className="text-xs text-muted-foreground">
                    Supervision globale des événements et actions d'exploitation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchActivities(filterType, page)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 text-primary", loading && "animate-spin")} />
                Actualiser
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border/50">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                    filterType === tab.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-surface text-muted-foreground hover:text-foreground hover:bg-card border border-border/40"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activities List */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Événements ({pagination?.total ?? 0})
              </span>
              {pagination && pagination.totalPages > 1 && (
                <span className="text-xs font-mono text-muted-foreground">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>
              )}
            </div>

            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
                <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Aucune activité enregistrée</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les nouveaux événements et notifications apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-surface/40 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{getCategoryBadge(item.category)}</div>
                      <div className="min-w-0">
                        <h3 className="font-display text-xs font-semibold text-foreground line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground shrink-0 sm:self-center">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{item.displayDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                  onClick={() => fetchActivities(filterType, page - 1)}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Précédent
                </button>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchActivities(filterType, page + 1)}
                  disabled={page >= pagination.totalPages || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </AsyncStateContainer>
    </AdminShell>
  );
}
