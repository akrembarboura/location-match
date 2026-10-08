"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { AdminStatusBadge } from "@/lib/admin-theme";
import { formatDT } from "@/lib/utils";
import {
  Building2,
  Clock,
  Eye,
  Filter,
  CheckCircle2,
} from "lucide-react";

interface AdminProperty {
  id: string;
  title: string;
  type: string;
  city: string;
  area: string;
  rentalCategory: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  pricing?: {
    price?: number;
    pricePeriod?: string;
  };
  summerPrice?: number;
  studentPrice?: number;
  verified: boolean;
  status: string;
  images?: any[];
  moderation?: {
    submittedAt?: string;
    rejectionReason?: string;
  };
  owner?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  } | null;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [counts, setCounts] = useState<{
    all: number;
    pending: number;
    underReview: number;
    published: number;
    rejected: number;
    archived: number;
  }>({
    all: 0,
    pending: 0,
    underReview: 0,
    published: 0,
    rejected: 0,
    archived: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);
        const url =
          selectedStatus === "ALL"
            ? "/api/admin/properties"
            : `/api/admin/properties?status=${selectedStatus}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Erreur de chargement des biens.");
        }
        const data = await res.json();
        setProperties(data.properties || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } catch (err: any) {
        setError(err.message || "Impossible de charger les biens.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [selectedStatus]);

  const tabs = [
    { key: "ALL", label: "Toutes les annonces", count: counts.all },
    { key: "PENDING_REVIEW", label: "En attente", count: counts.pending },
    { key: "UNDER_REVIEW", label: "En cours", count: counts.underReview },
    { key: "PUBLISHED", label: "Publiées", count: counts.published },
    { key: "REJECTED", label: "Refusées", count: counts.rejected },
    { key: "ARCHIVED", label: "Archivées", count: counts.archived },
  ];

  return (
    <AdminShell
      title="Biens & Modération"
      subtitle="Examen, validation et gestion de l'inventaire immobilier"
    >
      {/* Filter Tabs & Counters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedStatus(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedStatus === tab.key
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-card border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[0.65rem] ${
                selectedStatus === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-surface text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="mt-6">
        <AsyncStateContainer
          isLoading={loading}
          loadingText="Chargement des biens immobiliers…"
          isError={Boolean(error)}
          errorMessage={error || undefined}
          isEmpty={properties.length === 0}
          emptyTitle="Aucune annonce dans cette catégorie"
          emptyDescription="Aucun bien immobilier ne correspond au statut de modération sélectionné."
          onRetry={() => setSelectedStatus(selectedStatus)}
        >
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="p-3.5">Logement</th>
                  <th className="p-3.5">Catégorie</th>
                  <th className="p-3.5">Ville / Zone</th>
                  <th className="p-3.5">Propriétaire</th>
                  <th className="p-3.5">Prix</th>
                  <th className="p-3.5">Statut</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {properties.map((p) => {
                  const price =
                    p.pricing?.price || p.summerPrice || p.studentPrice || 0;
                  const ownerName = p.owner?.name || "Propriétaire anonyme";

                  return (
                    <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground max-w-[220px] truncate" title={p.title}>
                          {p.title}
                        </div>
                        <div className="text-[0.7rem] text-muted-foreground font-mono mt-0.5">
                          #{p.id}
                        </div>
                      </td>

                      <td className="p-3.5 text-muted-foreground capitalize">
                        {p.rentalCategory === "summer" ? "Vacances" : "Étudiant"}
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        <div>{p.city}</div>
                        {p.area && <div className="text-[0.7rem]">{p.area}</div>}
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        <div className="font-medium text-foreground">{ownerName}</div>
                        {p.owner?.phone && (
                          <div className="text-[0.7rem] font-mono">{p.owner.phone}</div>
                        )}
                      </td>

                      <td className="p-3.5 font-semibold text-foreground">
                        {formatDT(price)} DT
                      </td>

                      <td className="p-3.5">
                        <AdminStatusBadge status={p.status} showDot />
                      </td>

                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-card hover:border-primary/50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" /> Examen
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncStateContainer>
      </div>
    </AdminShell>
  );
}
