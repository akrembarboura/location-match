"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { formatDT } from "@/lib/utils";
import {
  Wallet,
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  RefreshCw,
  FileText,
  Building2,
  ShieldCheck,
} from "lucide-react";

interface OverviewData {
  commissionEarned: number;
  commissionCollected: number;
  commissionReported: number;
  commissionOutstanding: number;
  platformHeldRentalFunds: number;
  ownerPayable: number;
  unresolvedCount: number;
}

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/finance/overview");
      if (!res.ok) throw new Error("Erreur de chargement des données financières.");
      const data = await res.json();
      if (data.success) {
        setOverview(data.overview);
      } else {
        throw new Error(data.error || "Échec de chargement.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <AdminShell title="Gestion Financière & Commissions" subtitle="Ledger réconcilié, snapshots historiques et suivi des encaissements">
      <AsyncStateContainer isLoading={loading} isError={Boolean(error)} error={error} isEmpty={false} onRetry={fetchOverview}>
        {overview && (
          <div className="space-y-6">
            {/* Alert banner for unresolved configurations */}
            {overview.unresolvedCount > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-sm">
                      {overview.unresolvedCount} réservation(s) nécessitent une réconciliation de canal d'encaissement.
                    </span>
                    <p className="text-xs opacity-80">
                      Le canal d'encaissement n'est pas encore configuré (ex. héritage). Exécutez le script de réconciliation.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/finance/commissions"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shrink-0"
                >
                  Inspecter les commissions
                </Link>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-2xs transition-all hover:shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commissions Gagnées</span>
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">{formatDT(overview.commissionEarned)}</div>
                <p className="text-xs text-muted-foreground">Créations fermes à la confirmation</p>
              </div>

              <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-2xs transition-all hover:shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commissions Encaissées</span>
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {formatDT(overview.commissionCollected)}
                </div>
                <p className="text-xs text-muted-foreground">Règlements vérifiés & confirmés</p>
              </div>

              <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-2xs transition-all hover:shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commissions Déclarées</span>
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {formatDT(overview.commissionReported)}
                </div>
                <p className="text-xs text-muted-foreground">En attente de vérification admin</p>
              </div>

              <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-2xs transition-all hover:shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reste à Recouvrer</span>
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {formatDT(overview.commissionOutstanding)}
                </div>
                <p className="text-xs text-muted-foreground">Créances nettes impayées</p>
              </div>
            </div>

            {/* Treasury & Owner Payable Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base">Fonds Loyer Détenus Plateforme</h3>
                      <p className="text-xs text-muted-foreground">Encaissements réservations (PLATFORM_COLLECTS)</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-foreground font-mono">{formatDT(overview.platformHeldRentalFunds)}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Représente la trésorerie réelle collectée par LOC MAISON pour le compte des propriétaires. Ne constitue pas un chiffre d'affaires net.
                </p>
              </div>

              <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base">Solde Dû aux Propriétaires</h3>
                      <p className="text-xs text-muted-foreground">Payables nets déduction faite de la commission</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-foreground font-mono">{formatDT(overview.ownerPayable)}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Montant dû aux propriétaires après déduction de la commission contractuelle. Calculé exclusivement sur les fonds réels vérifiés.
                </p>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/finance/commissions"
                className="group p-5 bg-card border border-border/80 rounded-2xl hover:border-primary/50 transition-all shadow-2xs hover:shadow-card flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="p-2 w-fit rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Registre des Commissions</h4>
                  <p className="text-xs text-muted-foreground">Consulter la liste de tous les snapshots et taux appliqués.</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-primary gap-1">
                  Accéder au registre <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admin/finance/transactions"
                className="group p-5 bg-card border border-border/80 rounded-2xl hover:border-primary/50 transition-all shadow-2xs hover:shadow-card flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="p-2 w-fit rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Gestion des Transactions</h4>
                  <p className="text-xs text-muted-foreground">Vérifier, rejeter ou extourner les règlements déclarés.</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-primary gap-1">
                  Gérer les paiements <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admin/finance/owners"
                className="group p-5 bg-card border border-border/80 rounded-2xl hover:border-primary/50 transition-all shadow-2xs hover:shadow-card flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="p-2 w-fit rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Balances Propriétaires</h4>
                  <p className="text-xs text-muted-foreground">Suivre les créances et payables par propriétaire.</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-primary gap-1">
                  Voir les balances <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/admin/finance/settings"
                className="group p-5 bg-card border border-border/80 rounded-2xl hover:border-primary/50 transition-all shadow-2xs hover:shadow-card flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="p-2 w-fit rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Configuration Taux</h4>
                  <p className="text-xs text-muted-foreground">Configurer le taux par défaut et les accords spécifiques.</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-primary gap-1">
                  Paramétrer les règles <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </AsyncStateContainer>
    </AdminShell>
  );
}

