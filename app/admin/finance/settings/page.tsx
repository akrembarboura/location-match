"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { Settings, ShieldCheck, Plus, RefreshCw, AlertTriangle } from "lucide-react";

export default function AdminFinanceSettingsPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<number>(10);
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState<"PLATFORM" | "OWNER" | "PROPERTY">("PLATFORM");
  const [targetId, setTargetId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/finance/policies");
      if (!res.ok) throw new Error("Erreur de chargement des politiques.");
      const data = await res.json();
      if (data.success) {
        setPolicies(data.policies);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/finance/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName || `Politique ${newScope} ${newRate}%`,
          scope: newScope,
          targetId: newScope !== "PLATFORM" ? targetId : undefined,
          rate: Number(newRate),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName("");
        setTargetId("");
        fetchPolicies();
      } else {
        alert(data.error || "Échec de la sauvegarde.");
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunMigration = async (dryRun: boolean) => {
    try {
      setMigrating(true);
      setMigrationResult(null);
      const res = await fetch("/api/admin/finance/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (data.success) {
        setMigrationResult(data.report);
      } else {
        alert(data.error || "Échec de la migration.");
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <AdminShell title="Configuration des Commissions" subtitle="Gestion des règles de commissionnement et scripts de réconciliation">
      <div className="space-y-6">
        <AsyncStateContainer
          isLoading={loading}
          isError={Boolean(error)}
          error={error}
          isEmpty={false}
          onRetry={fetchPolicies}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Policy Form (1 Col) */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Nouvelle Règle de Commission</h3>
              </div>

              <form onSubmit={handleCreatePolicy} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Nom de la règle</label>
                  <input
                    type="text"
                    placeholder="ex. Commission Spéciale Propriétaire Sonia"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Portée (Precedence)</label>
                  <select
                    value={newScope}
                    onChange={(e: any) => setNewScope(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none"
                  >
                    <option value="PLATFORM">Plateforme (Par défaut)</option>
                    <option value="OWNER">Propriétaire Spécifique</option>
                    <option value="PROPERTY">Logement Spécifique</option>
                  </select>
                </div>

                {newScope !== "PLATFORM" && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Identifiant Cible (ID)</label>
                    <input
                      type="text"
                      placeholder={newScope === "OWNER" ? "ID du propriétaire" : "ID du logement"}
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Taux de Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono focus:outline-none"
                  />
                  <p className="text-[0.65rem] text-muted-foreground mt-1">Saisissez une valeur entre 0% et 50% max.</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {submitting ? "Enregistrement..." : "Enregistrer la politique"}
                </button>
              </form>
            </div>

            {/* Existing Policies Table & Migration Tools (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Policies List */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">Politiques Actives et Historiques</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase">
                        <th className="p-3">Nom</th>
                        <th className="p-3">Portée</th>
                        <th className="p-3">Cible</th>
                        <th className="p-3">Taux</th>
                        <th className="p-3">Version</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {policies.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="p-3 font-sans font-medium text-foreground">{p.name}</td>
                          <td className="p-3 font-semibold text-primary">{p.scope}</td>
                          <td className="p-3">{p.targetId || "Global"}</td>
                          <td className="p-3 font-bold text-emerald-600">{p.rate}%</td>
                          <td className="p-3">v{p.version || 1}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-500/10 text-emerald-600">
                              ACTIF
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legacy Backfill Migration Tool */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <RefreshCw className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-foreground text-base">Migration et Réconciliation des Données Héritées</h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Génère des snapshots et des obligations de commission pour toutes les réservations confirmées existantes n'ayant pas encore de snapshot financier. Les canaux d'encaissement non documentés seront étiquetés <span className="font-semibold text-amber-600">UNRESOLVED</span>.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    disabled={migrating}
                    onClick={() => handleRunMigration(true)}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl border border-border transition-colors"
                  >
                    Exécuter Simulation (Dry-Run)
                  </button>
                  <button
                    disabled={migrating}
                    onClick={() => handleRunMigration(false)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Exécuter Migration Réelle
                  </button>
                </div>

                {migrationResult && (
                  <div className="p-4 bg-muted/40 border border-border rounded-xl text-xs space-y-2 font-mono">
                    <div className="font-bold text-foreground">
                      Résultat Migration ({migrationResult.dryRun ? "SIMULATION" : "RÉELLE"}):
                    </div>
                    <div>Réservations traitées: {migrationResult.totalReservations}</div>
                    <div>Snapshots créés: {migrationResult.migratedSnapshots}</div>
                    <div>Obligations créées: {migrationResult.migratedObligations}</div>
                    <div>Passées (Existantes): {migrationResult.skippedExisting}</div>
                    <div className="text-amber-600 font-semibold">Canaux Non Résolus (UNRESOLVED): {migrationResult.unresolvedFlows}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AsyncStateContainer>
      </div>
    </AdminShell>
  );
}

