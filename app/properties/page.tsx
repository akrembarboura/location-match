"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/PageShell";
import { PropertyCard } from "@/components/site/PropertyCard";
import { SelectField } from "@/components/site/Field";
import { AREAS, PROPERTY_TYPES } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";

export default function PropertiesPage() {
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [use, setUse] = useState("");

  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ["public-properties", area, type, use],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (use === "Été") params.append("rentalCategory", "summer");
      if (use === "Étudiant") params.append("rentalCategory", "student");
      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement des biens");
      return res.json();
    },
  });

  const filtered = properties.filter((p: any) => {
    if (area && (p.area !== area && p.location?.area !== area)) return false;
    if (type && p.propertyType !== type && p.type !== type) return false;
    return true;
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="eyebrow">Biens disponibles</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Biens à Mahdia</h1>

        {/* Filters */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SelectField
            options={["Été", "Étudiant"]}
            value={use}
            onChange={(e) => setUse(e.target.value)}
            placeholder="Été ou étudiant"
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
            placeholder="Tous les types"
          />
        </div>

        {/* Count */}
        <p className="mt-4 text-sm text-muted-foreground">
          {isLoading ? "Chargement des biens…" : `${filtered.length} bien${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`}
        </p>

        {/* List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="mt-10 text-center text-destructive">
            Impossible de charger les biens pour le moment.
          </p>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            Aucun bien publié ne correspond à ces critères pour le moment.
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p: any) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

