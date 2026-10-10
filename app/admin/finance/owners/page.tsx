"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { formatDT } from "@/lib/utils";
import { Building2, DollarSign, Wallet } from "lucide-react";

export default function AdminOwnerBalancesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/finance/owners");
      if (!res.ok) throw new Error("Erreur de chargement des balances propriétaires.");
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
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
    fetchBalances();
  }, []);

  return (
    <AdminShell title="Balances Propriétaires" subtitle="Suivi individualisé des créances et des montants payables par propriétaire">
      <AsyncStateContainer
        isLoading={loading}
        isError={Boolean(error)}
        error={error}
        isEmpty={items.length === 0}
        emptyTitle="Aucun propriétaire"
        emptyDescription="Aucun solde propriétaire disponible pour le moment."
        onRetry={fetchBalances}
      >
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4">Propriétaire</th>
                  <th className="p-4">Réservations</th>
                  <th className="p-4">Commission Dûe</th>
                  <th className="p-4">Versements Vérifiés</th>
                  <th className="p-4">Versements Déclarés</th>
                  <th className="p-4">Créance Commission Reste</th>
                  <th className="p-4">Solde Payable Propriétaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aucun propriétaire enregistré.
                    </td>
                  </tr>
                ) : (
                  items.map((owner) => (
                    <tr key={owner.ownerId} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium text-foreground">
                        <div>{owner.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{owner.phone || owner.email}</div>
                      </td>
                      <td className="p-4 font-mono">{owner.reservationCount}</td>
                      <td className="p-4 font-mono">{formatDT(owner.commissionEarned)}</td>
                      <td className="p-4 font-mono font-medium text-foreground">{formatDT(owner.verifiedRemittances)}</td>
                      <td className="p-4 font-mono font-medium text-foreground">{formatDT(owner.reportedRemittances)}</td>
                      <td className="p-4 font-mono font-semibold text-foreground">{formatDT(owner.commissionReceivable)}</td>
                      <td className="p-4 font-mono font-semibold text-foreground">{formatDT(owner.ownerPayable)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AsyncStateContainer>
    </AdminShell>
  );
}

