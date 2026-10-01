"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { PropertyCard } from "@/components/site/PropertyCard";
import { SelectField } from "@/components/site/Field";
import { AREAS, PROPERTY_TYPES, properties } from "@/lib/mock-data";



function PropertiesPage() {
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [use, setUse] = useState("");
  const list = useMemo(
    () =>
      properties.filter(
        (p) =>
          (!area || p.area === area) &&
          (!type || p.type === type) &&
          (!use || (use === "Été" ? p.summerPrice : p.studentPrice)),
      ),
    [area, type, use],
  );
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="eyebrow">Biens</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Biens à Mahdia</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SelectField options={["Été", "Étudiant"]} value={use} onChange={(e) => setUse(e.target.value)} placeholder="Été ou étudiant" />
          <SelectField options={AREAS} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Tous les quartiers" />
          <SelectField options={PROPERTY_TYPES} value={type} onChange={(e) => setType(e.target.value)} placeholder="Tous les types" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{list.length} biens</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
        {list.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">Aucun bien ne correspond à ces filtres pour le moment.</p>
        )}
      </div>
    </PageShell>
  );
}

export default PropertiesPage;
