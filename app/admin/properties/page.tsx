"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/site/PropertyCard";
import { formatDT } from "@/lib/utils";
import { Loader2, AlertCircle, Building2 } from "lucide-react";

interface AdminProperty {
  id: string;
  title: string;
  type: string;
  area: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  summerPrice?: number;
  studentPrice?: number;
  verified: boolean;
  status: string;
  images?: string[];
  owner?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [ownersCount, setOwnersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/properties");
        if (!res.ok) {
          throw new Error("Erreur de chargement");
        }
        const data = await res.json();
        setProperties(data.properties || []);
        setOwnersCount(data.ownersCount || 0);
      } catch {
        setError("Impossible de charger les biens immobiliers. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const subtitle = loading
    ? "Chargement des biens…"
    : `${properties.length} bien${properties.length > 1 ? "s" : ""} · ${ownersCount} propriétaire${ownersCount > 1 ? "s" : ""}`;

  return (
    <AdminShell title="Biens" subtitle={subtitle}>
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement des biens enregistrés…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="rounded-full bg-surface p-3 text-muted-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 font-display text-lg text-foreground">Aucun bien immobilier enregistré</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun bien n'a été ajouté au catalogue ou par les propriétaires pour le moment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Réf</th>
                <th className="p-3">Bien</th>
                <th className="p-3">Propriétaire</th>
                <th className="p-3">Été / sem</th>
                <th className="p-3">Étudiant / mois</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface/50">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                  <td className="p-3">
                    <Link href={`/properties/${p.id}`} className="font-medium text-foreground hover:text-primary">
                      {p.type} — {p.area}
                    </Link>
                  </td>
                  <td className="p-3">
                    {p.owner ? (
                      <>
                        <div className="font-medium text-foreground">{p.owner.name}</div>
                        <div className="text-xs text-muted-foreground">{p.owner.phone}</div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">{p.summerPrice ? `${formatDT(p.summerPrice)} DT` : "—"}</td>
                  <td className="p-3">{p.studentPrice ? `${formatDT(p.studentPrice)} DT` : "—"}</td>
                  <td className="p-3">
                    <StatusPill status={p.status as any} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
