"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { PropertyModerationBadge } from "@/components/properties/PropertyModerationBadge";
import { formatDT } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
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
    { key: "ALL", label: "Toutes", count: counts.all },
    { key: "PENDING_REVIEW", label: "En attente", count: counts.pending },
    { key: "UNDER_REVIEW", label: "En cours", count: counts.underReview },
    { key: "PUBLISHED", label: "Publiées", count: counts.published },
    { key: "REJECTED", label: "Refusées", count: counts.rejected },
    { key: "ARCHIVED", label: "Archivées", count: counts.archived },
  ];

  return (
    <AdminShell
      title="Biens & Modération"
      subtitle="Examen, validation et gestion des logements déposés par les propriétaires"
    >
      {/* Filter Tabs & Counters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedStatus(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === tab.key
                ? "bg-primary text-primary-foreground shadow-xs"
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

      {/* Main Table */}
      <div className="mt-6">
        <AsyncStateContainer
          isLoading={loading}
          loadingText="Chargement des biens immobiliers…"
          isError={Boolean(error)}
          errorMessage={error || undefined}
          isEmpty={properties.length === 0}
          emptyTitle="Aucune annonce dans cette catégorie"
          emptyDescription={
            selectedStatus === "PENDING_REVIEW"
              ? "Toutes les demandes de publication ont été traitées."
              : "Aucun bien ne correspond au filtre sélectionné."
          }
          onRetry={() => {
            setLoading(true);
            setError(null);
            const url =
              selectedStatus === "ALL"
                ? "/api/admin/properties"
                : `/api/admin/properties?status=${selectedStatus}`;
            fetch(url)
              .then((res) => {
                if (!res.ok) throw new Error("Erreur de chargement des biens.");
                return res.json();
              })
              .then((data) => {
                setProperties(data.properties || []);
                if (data.counts) setCounts(data.counts);
              })
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        >
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Réf</th>
                  <th className="p-3.5">Logement</th>
                  <th className="p-3.5">Propriétaire</th>
                  <th className="p-3.5">Tarif</th>
                  <th className="p-3.5">Statut</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {properties.map((p) => {
                  const cover = p.images?.[0]?.url || "/placeholder-property.jpg";
                  const price = p.pricing?.price || p.summerPrice || p.studentPrice || 0;
                  const period = p.pricing?.pricePeriod === "month" ? "mois" : "sem";

                  return (
                    <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                      <td className="p-3.5 font-mono text-xs text-muted-foreground">
                        {p.id}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={cover}
                            alt=""
                            className="h-10 w-12 rounded object-cover border border-border shrink-0 bg-surface"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate max-w-xs">
                              {p.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.type} · {p.city} {p.area ? `(${p.area})` : ""} · {p.images?.length || 0} photo{(p.images?.length || 0) > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {p.owner ? (
                          <div>
                            <p className="font-medium text-foreground text-xs">{p.owner.name}</p>
                            <p className="text-xs text-muted-foreground">{p.owner.phone}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="p-3.5 font-medium text-foreground text-xs">
                        {price > 0 ? `${formatDT(price)} DT / ${period}` : "—"}
                      </td>

                      <td className="p-3.5">
                        <PropertyModerationBadge status={p.status} />
                      </td>

                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Examiner
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

