"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Field, TextField, SelectField, ChipGroup } from "@/components/site/Field";
import { AREAS, PROPERTY_TYPES, SUMMER_AMENITIES } from "@/lib/mock-data";



function ListProperty() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [use, setUse] = useState<string[]>([]);
  const [amen, setAmen] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const toggle = (set: typeof setUse) => (v: string) => set((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !phone || !area || !type) return setError("Veuillez indiquer votre nom, téléphone, quartier et type de bien.");
    setError(null);
    setDone(true);
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="eyebrow">Pour les propriétaires</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Publier votre bien</h1>
        <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-7">
          {done ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <p className="mt-4 font-display text-xl text-foreground">Merci, {name}</p>
              <p className="mt-2 text-muted-foreground">Nous vous appellerons pour organiser une visite de contrôle.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Votre nom"><TextField value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Téléphone / WhatsApp"><TextField type="tel" placeholder="+216" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
                <Field label="Quartier"><SelectField options={AREAS} value={area} onChange={(e) => setArea(e.target.value)} /></Field>
                <Field label="Type de bien"><SelectField options={PROPERTY_TYPES} value={type} onChange={(e) => setType(e.target.value)} /></Field>
              </div>
              <div>
                <p className="mb-2.5 text-[0.8rem] font-medium text-foreground">Disponible pour</p>
                <ChipGroup options={["Locations d'été", "Étudiants"]} selected={use} onToggle={toggle(setUse)} />
              </div>
              <div>
                <p className="mb-2.5 text-[0.8rem] font-medium text-foreground">Équipements</p>
                <ChipGroup options={SUMMER_AMENITIES} selected={amen} onToggle={toggle(setAmen)} />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <button type="submit" className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark sm:w-auto">Envoyer mon bien</button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default ListProperty;
