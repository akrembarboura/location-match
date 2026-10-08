"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Phone, MapPin, Calendar, Home, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Field, TextField, SelectField, ChipGroup } from "./Field";
import {
  PROPERTY_TYPES,
  SUMMER_AMENITIES,
  STUDENT_PREFERENCES,
  UNIVERSITIES,
} from "@/lib/mock-data";
import {
  TUNISIAN_DESTINATIONS,
  DESTINATION_AREAS,
  normalizeTunisianPhone,
} from "@/lib/rentals/request-schema";
import { trackEvent } from "@/lib/analytics/client";

function SubmitBar({
  label = "Envoyer ma demande",
  loading,
  error,
}: {
  label?: string;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="sticky bottom-16 z-20 -mx-4 mt-8 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      {error && (
        <div className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-70 lg:w-auto"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Envoi de votre demande…" : label}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        Aucun paiement requis. Notre équipe vous contacte sur WhatsApp ou par téléphone pour vous proposer des biens disponibles.
      </p>
    </div>
  );
}

export function SummerRequestForm() {
  const router = useRouter();

  // Wizard step (1: Séjour & Destination, 2: Logement & Budget, 3: Coordonnées & Confirmation)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Client Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Stay Info
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  // Location
  const [destination, setDestination] = useState("Mahdia");
  const [area, setArea] = useState("");
  const [customDestination, setCustomDestination] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [flexibleLocation, setFlexibleLocation] = useState(false);

  // Property Requirements
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Live Phone helper preview
  const normalizedPhonePreview = phone.trim() ? normalizeTunisianPhone(phone) : null;

  // Pre-fill user information if logged in
  useEffect(() => {
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (name) setFullName(name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const availableAreas = DESTINATION_AREAS[destination] || [];

  function validateStep1(): boolean {
    setError(null);
    if (!checkIn || !checkOut) {
      setError("Veuillez indiquer vos dates d'arrivée et de départ.");
      return false;
    }
    if (checkOut <= checkIn) {
      setError("La date de départ doit être postérieure à la date d'arrivée.");
      return false;
    }
    const effectiveDestination = destination === "Autre" ? customDestination.trim() : destination;
    if (!effectiveDestination) {
      setError("Veuillez sélectionner ou indiquer une destination.");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    setError(null);
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError("Veuillez indiquer votre nom et prénom (au moins 3 caractères).");
      setStep(3);
      return;
    }

    const normalizedPhone = normalizeTunisianPhone(phone);
    if (!normalizedPhone) {
      setError("Numéro de téléphone tunisien invalide. Exemple : 22 123 456 ou +216 22 123 456.");
      setStep(3);
      return;
    }

    const effectiveDestination = destination === "Autre" ? customDestination.trim() : destination;
    const effectiveArea =
      destination === "Autre"
        ? customArea.trim()
        : area === "Autre quartier (préciser)"
        ? customArea.trim()
        : area;

    setLoading(true);

    try {
      const payload = {
        rentalCategory: "summer" as const,
        fullName: fullName.trim(),
        phone: normalizedPhone,
        email: email.trim() || undefined,
        destination: effectiveDestination,
        area: effectiveArea || undefined,
        flexibleLocation,
        propertyType: propertyType || undefined,
        checkIn,
        checkOut,
        guests: Number(guests) || 1,
        budget: budget ? Number(budget) : undefined,
        budgetPeriod: "stay" as const,
        amenities,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      trackEvent("request_submitted", {
        city: effectiveDestination,
        rentalCategory: "summer",
        propertyType: propertyType || undefined,
        forceTrack: true,
        properties: {
          destination: effectiveDestination,
          guests: Number(guests) || 1,
        },
      });

      router.push(
        `/request/success?ref=${data.id}&name=${encodeURIComponent(fullName)}&dest=${encodeURIComponent(effectiveDestination)}&type=summer`
      );
    } catch (err: any) {
      setError(err.message || "Impossible d'envoyer la demande. Réessayez plus tard.");
      setLoading(false);
    }
  }

  const effectiveDestinationDisplay = destination === "Autre" ? customDestination : destination;

  return (
    <div className="space-y-6">
      {/* Step Wizard Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 transition-colors ${
              step === 1 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step === 1
                  ? "bg-primary text-primary-foreground"
                  : step > 1
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </span>
            <span>Séjour & Destination</span>
          </button>

          <div className="h-0.5 flex-1 bg-border mx-3" />

          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className={`flex items-center gap-2 transition-colors ${
              step === 2 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step === 2
                  ? "bg-primary text-primary-foreground"
                  : step > 2
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <span>Critères & Budget</span>
          </button>

          <div className="h-0.5 flex-1 bg-border mx-3" />

          <button
            type="button"
            onClick={() => validateStep1() && setStep(3)}
            className={`flex items-center gap-2 transition-colors ${
              step === 3 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step === 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </span>
            <span>Coordonnées</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3.5 text-sm font-medium text-destructive" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* STEP 1: Séjour & Destination */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg text-foreground border-b border-border pb-2">
                <Calendar className="h-5 w-5 text-primary" /> 1. Votre séjour
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Date d'arrivée *">
                  <TextField
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </Field>
                <Field label="Date de départ *">
                  <TextField
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </Field>
                <Field label="Nombre de voyageurs *">
                  <TextField
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h2 className="flex items-center gap-2 font-display text-lg text-foreground border-b border-border pb-2">
                <MapPin className="h-5 w-5 text-primary" /> 2. Où souhaitez-vous séjourner ?
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Destination / Ville *">
                  <SelectField
                    options={[...TUNISIAN_DESTINATIONS]}
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setArea("");
                      setCustomArea("");
                    }}
                    placeholder="Choisissez une ville"
                  />
                </Field>

                {destination === "Autre" ? (
                  <>
                    <Field label="Votre ville / région *">
                      <TextField
                        required
                        placeholder="ex: Kélibia, Tabarka, Tozeur..."
                        value={customDestination}
                        onChange={(e) => setCustomDestination(e.target.value)}
                      />
                    </Field>
                    <Field label="Quartier ou zone souhaitée" hint="Optionnel" className="sm:col-span-2">
                      <TextField
                        placeholder="ex: Centre ville, Plage..."
                        value={customArea}
                        onChange={(e) => setCustomArea(e.target.value)}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field
                      label="Quartier préféré"
                      hint={availableAreas.length > 0 ? "Optionnel" : "Précisez votre zone"}
                    >
                      {availableAreas.length > 0 ? (
                        <SelectField
                          options={[...availableAreas, "Autre quartier (préciser)"]}
                          value={area}
                          onChange={(e) => {
                            setArea(e.target.value);
                            if (e.target.value !== "Autre quartier (préciser)") {
                              setCustomArea("");
                            }
                          }}
                          placeholder={`Tous les quartiers de ${destination}`}
                        />
                      ) : (
                        <TextField
                          placeholder="ex: Zone touristique, Centre ville..."
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                        />
                      )}
                    </Field>
                    {area === "Autre quartier (préciser)" && (
                      <Field label="Précisez votre quartier souhaité" className="sm:col-span-2">
                        <TextField
                          required
                          placeholder="Indiquez le quartier ou la zone souhaitée"
                          value={customArea}
                          onChange={(e) => setCustomArea(e.target.value)}
                        />
                      </Field>
                    )}
                  </>
                )}

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="flexibleLocation"
                    checked={flexibleLocation}
                    onChange={(e) => setFlexibleLocation(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="flexibleLocation" className="text-sm text-foreground cursor-pointer">
                    Je suis flexible sur les quartiers voisins si le logement correspond à mes critères.
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => validateStep1() && setStep(2)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Suivant : Critères & Budget ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Critères & Budget */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg text-foreground border-b border-border pb-2">
                <Home className="h-5 w-5 text-primary" /> Quel logement recherchez-vous ?
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Type de bien">
                  <SelectField
                    options={PROPERTY_TYPES}
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    placeholder="Tous les types (Studio, S+1, S+2, Villa...)"
                  />
                </Field>
                <Field
                  label="Budget maximum pour le séjour (DT)"
                  hint="Budget total souhaité pour l'ensemble du séjour (optionnel)"
                >
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

              <div className="mt-5">
                <p className="mb-2.5 text-[0.8rem] font-medium text-foreground">Équipements souhaités</p>
                <ChipGroup
                  options={SUMMER_AMENITIES}
                  selected={amenities}
                  onToggle={(v) =>
                    setAmenities((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))
                  }
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => validateStep2() && setStep(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Suivant : Coordonnées ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Coordonnées & Recap */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg text-foreground border-b border-border pb-2">
                <User className="h-5 w-5 text-primary" /> Vos coordonnées
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nom et prénom *">
                  <TextField
                    required
                    placeholder="ex: Mohamed Trabelsi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Field>
                <div>
                  <Field
                    label="Numéro de téléphone (WhatsApp) *"
                    hint="Nous utiliserons ce numéro pour vous contacter concernant votre demande."
                  >
                    <TextField
                      type="tel"
                      required
                      placeholder="ex: 22 123 456 ou +216 22 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                  {phone.trim() && (
                    <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
                      normalizedPhonePreview ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {normalizedPhonePreview ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Format reconnu : <span className="font-mono">{normalizedPhonePreview}</span>
                        </>
                      ) : (
                        <>
                          ⚠️ Numéro tunisien valide requis (8 chiffres, ex: 22 123 456)
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
              <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Récapitulatif de votre demande d&apos;été
              </h4>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <span className="font-medium text-foreground">Destination :</span> {effectiveDestinationDisplay} {area ? `(${area})` : ""}
                </div>
                <div>
                  <span className="font-medium text-foreground">Dates :</span> {checkIn} ➔ {checkOut}
                </div>
                <div>
                  <span className="font-medium text-foreground">Voyageurs :</span> {guests} personne(s)
                </div>
                <div>
                  <span className="font-medium text-foreground">Budget & Type :</span> {budget ? `${budget} DT` : "Non spécifié"} • {propertyType || "Tous types"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
              >
                ← Précédent
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Envoi de votre demande…" : "Confirmer & Envoyer ma demande"}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Aucun paiement requis. Notre équipe vous contacte sur WhatsApp ou par téléphone pour vous proposer des biens disponibles.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

export function StudentRequestForm() {
  const router = useRouter();

  // Wizard step (1: Université & Dates, 2: Logement & Budget, 3: Coordonnées & Confirmation)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Client Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Academic / Stay
  const [destination, setDestination] = useState("Mahdia");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [students, setStudents] = useState("1");

  // Housing requirements
  const [propertyType, setPropertyType] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [budget, setBudget] = useState("");
  const [prefs, setPrefs] = useState<string[]>([]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const normalizedPhonePreview = phone.trim() ? normalizeTunisianPhone(phone) : null;

  useEffect(() => {
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (name) setFullName(name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  function validateStep1(): boolean {
    setError(null);
    if (!checkIn) {
      setError("Veuillez indiquer votre date d'emménagement souhaitée.");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    setError(null);
    if (!budget || Number(budget) <= 0) {
      setError("Veuillez indiquer votre budget mensuel par personne en dinars.");
      return false;
    }
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (!validateStep2()) {
      setStep(2);
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError("Veuillez indiquer votre nom et prénom (au moins 3 caractères).");
      setStep(3);
      return;
    }

    const normalizedPhone = normalizeTunisianPhone(phone);
    if (!normalizedPhone) {
      setError("Numéro de téléphone tunisien invalide. Exemple : 22 123 456 ou +216 22 123 456.");
      setStep(3);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        rentalCategory: "student" as const,
        fullName: fullName.trim(),
        phone: normalizedPhone,
        email: email.trim() || undefined,
        destination,
        checkIn,
        checkOut: checkOut || undefined,
        students: Number(students) || 1,
        budget: Number(budget),
        budgetPeriod: "month" as const,
        propertyType: propertyType || undefined,
        genderPreference: genderPreference || undefined,
        amenities: prefs,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      router.push(
        `/request/success?ref=${data.id}&name=${encodeURIComponent(fullName)}&dest=${encodeURIComponent(destination)}&type=student`
      );
    } catch (err: any) {
      setError(err.message || "Impossible d'envoyer la demande. Réessayez plus tard.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Wizard Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 transition-colors ${
              step === 1 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step === 1
                  ? "bg-primary text-primary-foreground"
                  : step > 1
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </span>
            <span>Université & Dates</span>
          </button>

          <div className="h-0.5 flex-1 bg-border mx-3" />

          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className={`flex items-center gap-2 transition-colors ${
              step === 2 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step === 2
                  ? "bg-primary text-primary-foreground"
                  : step > 2
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <span>Logement & Budget</span>
          </button>

          <div className="h-0.5 flex-1 bg-border mx-3" />

          <button
            type="button"
            onClick={() => validateStep1() && validateStep2() && setStep(3)}
            className={`flex items-center gap-2 transition-colors ${
              step === 3 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step === 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </span>
            <span>Coordonnées</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3.5 text-sm font-medium text-destructive" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* STEP 1: Université & Dates */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg text-foreground border-b border-border pb-2">
                <Calendar className="h-5 w-5 text-primary" /> Votre année universitaire
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Ville / Destination d'études *">
                  <SelectField
                    options={[...TUNISIAN_DESTINATIONS]}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Sélectionnez une ville"
                  />
                </Field>
                <Field label="Date d'emménagement souhaitée *">
                  <TextField
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </Field>
                <Field label="Date de fin de bail (optionnel)">
                  <TextField
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => validateStep1() && setStep(2)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Suivant : Logement & Budget ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Logement & Budget */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg text-foreground border-b border-border pb-2">
                <Home className="h-5 w-5 text-primary" /> Logement & Préférences
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre d'étudiants (colocation)">
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
                    options={["Studio", "S+1", "S+2", "S+3", "Chambre individuelle", "Tous les types"]}
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    placeholder="Tous les types"
                  />
                </Field>
                <Field label="Préférence de colocation">
                  <SelectField
                    options={["Étudiantes (Filles)", "Étudiants (Garçons)", "Pas de préférence"]}
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value)}
                    placeholder="Pas de préférence"
                  />
                </Field>
                <Field label="Budget mensuel par personne * (DT)" hint="En dinar tunisien / mois">
                  <TextField
                    type="number"
                    min={0}
                    step={10}
                    required
                    placeholder="ex: 250"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-5">
                <p className="mb-2.5 text-[0.8rem] font-medium text-foreground">Critères importants</p>
                <ChipGroup
                  options={STUDENT_PREFERENCES}
                  selected={prefs}
                  onToggle={(v) => setPrefs((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => validateStep2() && setStep(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Suivant : Coordonnées ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Coordonnées & Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg text-foreground border-b border-border pb-2">
                <User className="h-5 w-5 text-primary" /> Vos coordonnées
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nom et prénom *">
                  <TextField
                    required
                    placeholder="ex: Yasmine Ben Ali"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Field>
                <div>
                  <Field
                    label="Numéro de téléphone (WhatsApp) *"
                    hint="Nous utiliserons ce numéro pour vous contacter concernant votre demande."
                  >
                    <TextField
                      type="tel"
                      required
                      placeholder="ex: 98 123 456 ou +216 98 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                  {phone.trim() && (
                    <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
                      normalizedPhonePreview ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {normalizedPhonePreview ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Format reconnu : <span className="font-mono">{normalizedPhonePreview}</span>
                        </>
                      ) : (
                        <>
                          ⚠️ Numéro tunisien valide requis (8 chiffres, ex: 98 123 456)
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
              <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Récapitulatif de votre demande étudiante
              </h4>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <span className="font-medium text-foreground">Destination d&apos;études :</span> {destination}
                </div>
                <div>
                  <span className="font-medium text-foreground">Emménagement :</span> {checkIn}
                </div>
                <div>
                  <span className="font-medium text-foreground">Étudiants :</span> {students} personne(s)
                </div>
                <div>
                  <span className="font-medium text-foreground">Budget mensuel :</span> {budget ? `${budget} DT / mois` : "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
              >
                ← Précédent
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Envoi de votre demande…" : "Confirmer & Envoyer ma demande"}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Aucun paiement requis. Notre équipe vous contacte sur WhatsApp ou par téléphone pour vous proposer des biens disponibles.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
