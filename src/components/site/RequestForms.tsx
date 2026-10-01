"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Field, TextField, SelectField, ChipGroup } from "./Field";
import {
  AREAS,
  PROPERTY_TYPES,
  SUMMER_AMENITIES,
  STUDENT_PREFERENCES,
  UNIVERSITIES,
} from "@/lib/mock-data";

function useSubmit(type: "summer" | "student") {
  const navigate = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(valid: boolean, message: string) {
    if (!valid) {
      setError(message);
      return;
    }
    setError(null);
    setLoading(true);
    window.setTimeout(() => {
      navigate.push(`/request/success?type=${type}`);
    }, 700);
  }

  return { loading, error, submit };
}

function SubmitBar({
  label,
  loading,
  error,
}: {
  label: string;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="sticky bottom-16 z-20 -mx-4 mt-8 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      {error && (
        <p className="mb-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-70 lg:w-auto"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Envoi en cours..." : label}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        Aucun paiement. Notre équipe vous répond sur WhatsApp en quelques heures.
      </p>
    </div>
  );
}

export function SummerRequestForm() {
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [guests, setGuests] = useState("2");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [budget, setBudget] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const { loading, error, submit } = useSubmit("summer");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(
      Boolean(arrival && departure && guests),
      "Veuillez indiquer vos dates d'arrivée et de départ, et le nombre de voyageurs.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Arrivée">
          <TextField type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} />
        </Field>
        <Field label="Départ">
          <TextField type="date" value={departure} onChange={(e) => setDeparture(e.target.value)} />
        </Field>
        <Field label="Voyageurs">
          <TextField
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          />
        </Field>
        <Field label="Quartier préféré" hint="Laissez vide si vous êtes flexible.">
          <SelectField
            options={AREAS}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="N'importe où à Mahdia"
          />
        </Field>
        <Field label="Type de bien">
          <SelectField
            options={PROPERTY_TYPES}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Tous les types"
          />
        </Field>
        <Field label="Chambres">
          <SelectField
            options={["1", "2", "3", "4+"]}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            placeholder="Peu importe"
          />
        </Field>
        <Field label="Budget maximum" hint="Par semaine, en dinar tunisien." className="sm:col-span-2">
          <TextField
            type="number"
            min={0}
            step={50}
            placeholder="ex: 1500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2.5 text-[0.8rem] font-medium text-foreground">Équipements souhaités</p>
        <ChipGroup
          options={SUMMER_AMENITIES}
          selected={amenities}
          onToggle={(v) =>
            setAmenities((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))
          }
        />
      </div>

      <SubmitBar label="Trouver ma maison" loading={loading} error={error} />
    </form>
  );
}

export function StudentRequestForm() {
  const [university, setUniversity] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [moveOut, setMoveOut] = useState("");
  const [budget, setBudget] = useState("");
  const [students, setStudents] = useState("1");
  const [type, setType] = useState("");
  const [gender, setGender] = useState("");
  const [prefs, setPrefs] = useState<string[]>([]);
  const { loading, error, submit } = useSubmit("student");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(
      Boolean(university && moveIn && budget),
      "Veuillez choisir votre université, date d'emménagement et budget mensuel.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Université" className="sm:col-span-2">
          <SelectField
            options={UNIVERSITIES}
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="Où étudiez-vous ?"
          />
        </Field>
        <Field label="Date d'emménagement">
          <TextField type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
        </Field>
        <Field label="Date de départ (optionnel)">
          <TextField type="date" value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
        </Field>
        <Field label="Budget mensuel" hint="Par personne, en dinar tunisien.">
          <TextField
            type="number"
            min={0}
            step={10}
            placeholder="ex: 300"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </Field>
        <Field label="Nombre d'étudiants">
          <TextField
            type="number"
            min={1}
            max={8}
            value={students}
            onChange={(e) => setStudents(e.target.value)}
          />
        </Field>
        <Field label="Type de bien">
          <SelectField
            options={["Studio", "S+1", "S+2", "S+3", "Chambre"]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Tous les types"
          />
        </Field>
        <Field label="Préférence de colocation">
          <SelectField
            options={["Étudiantes", "Étudiants", "Pas de préférence"]}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder="Pas de préférence"
          />
        </Field>
      </div>

      <div>
        <p className="mb-2.5 text-[0.8rem] font-medium text-foreground">Préférences</p>
        <ChipGroup
          options={STUDENT_PREFERENCES}
          selected={prefs}
          onToggle={(v) => setPrefs((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
        />
      </div>

      <SubmitBar label="Trouver mon logement" loading={loading} error={error} />
    </form>
  );
}
