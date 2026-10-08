"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/PageShell";
import { PropertyCard } from "@/components/site/PropertyCard";
import { SelectField } from "@/components/site/Field";
import { AREAS, PROPERTY_TYPES } from "@/lib/mock-data";
import { AsyncStateContainer } from "@/components/shared";

export default function PropertiesPage() {
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [use, setUse] = useState("");

  const query = useQuery({
    queryKey: ["public-properties", area, type, use],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (use === "Été") params.append("rentalCategory", "summer");
      if (use === "Étudiant") params.append("rentalCategory", "student");
      if (type) params.append("category", type);
      if (area) params.append("city", area);

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement des biens immobiliers");
      return res.json();
    },
  });

  const properties = query.data || [];

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 pb-24 lg:pb-12">
        <p className="eyebrow">Logements disponibles</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          Logements à Mahdia
        </h1>

        {/* Search Controls & Filters */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SelectField
            options={["Été", "Étudiant"]}
            value={use}
            onChange={(e) => setUse(e.target.value)}
            placeholder="Tous les usages (Été / Étudiant)"
          />
          <SelectField
            options={AREAS}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Tous les quartiers"
          />
          <SelectField
            options={PROPERTY_TYPES}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Tous les types de biens"
          />
        </div>

        {/* Results Counter */}
        <div className="mt-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {query.isLoading
              ? "Recherche des logements en cours…"
              : `${properties.length} logement${properties.length > 1 ? "s" : ""} disponible${properties.length > 1 ? "s" : ""}`}
          </p>
          {(area || type || use) && (
            <button
              type="button"
              onClick={() => {
                setArea("");
                setType("");
                setUse("");
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Async State Container (9-State UX Standard) */}
        <AsyncStateContainer
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={properties}
          onRetry={() => query.refetch()}
          emptyProps={{
            title: "Aucun logement disponible",
            description:
              "Aucun logement publié ne correspond exactement à vos critères de recherche. Essayez de réinitialiser les filtres ou de modifier votre quartier.",
            actionLabel: "Réinitialiser la recherche",
            onAction: () => {
              setArea("");
              setType("");
              setUse("");
            },
          }}
        >
          {(list) => (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </AsyncStateContainer>
      </div>
    </PageShell>
  );
}
