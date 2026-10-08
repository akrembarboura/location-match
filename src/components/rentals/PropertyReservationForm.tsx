"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Calendar,
  Users,
  Phone,
  User,
  Mail,
  AlertCircle,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Clock,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SafeImage } from "@/components/rentals/SafeImage";
import { formatDT } from "@/lib/utils";
import { normalizeTunisianPhone } from "@/lib/rentals/request-schema";
import { UNIVERSITIES } from "@/lib/mock-data";
import { trackEvent } from "@/lib/analytics/client";
import { resolvePropertyPricing } from "@/lib/pricing/pricing.service";

interface PropertyReservationFormProps {
  propertyId: string;
  category: "summer" | "student" | "universe";
}

export function PropertyReservationForm({
  propertyId,
  category,
}: PropertyReservationFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Property data state
  const [property, setProperty] = useState<any>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [propertyError, setPropertyError] = useState<string | null>(null);

  // Form state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [message, setMessage] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedCategory = category === "universe" ? "student" : category;

  // Pre-fill user profile info
  useEffect(() => {
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (name) setFullName(name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Load authoritative property data
  useEffect(() => {
    async function loadProperty() {
      try {
        setLoadingProperty(true);
        setPropertyError(null);
        const res = await fetch(`/api/properties/${propertyId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Logement introuvable.");
          }
          throw new Error("Impossible de charger les détails du logement.");
        }
        const data = await res.json();
        setProperty(data);

        // Pre-fill default capacity
        const maxGuests = data.capacity?.guests || data.guests || 2;
        setGuests(Math.min(2, maxGuests).toString());
      } catch (err: any) {
        setPropertyError(err.message || "Erreur de chargement.");
      } finally {
        setLoadingProperty(false);
      }
    }

    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  if (loadingProperty) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement des détails du logement…</p>
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
        <h3 className="mt-2 font-display text-lg font-semibold text-destructive">
          {propertyError || "Logement introuvable"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ce logement n&apos;est pas disponible ou l&apos;adresse demandée est incorrecte.
        </p>
        <Link
          href="/houses"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Explorer les logements disponibles
        </Link>
      </div>
    );
  }

  // Wizard Step state (1: Dates & Guests, 2: Remarques, 3: Contact & Validation)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Live Phone Validation Helper
  const normalizedPhonePreview = phone.trim() ? normalizeTunisianPhone(phone) : null;

  // Category mismatch check
  const actualPropCategory = (
    property.rentalCategory || (property.summerPrice ? "summer" : "student")
  ).toLowerCase();

  if (actualPropCategory !== normalizedCategory) {
    const correctPath =
      actualPropCategory === "summer" ? "/request/summer" : "/request/universe";
    const label =
      actualPropCategory === "summer" ? "Location d'été" : "Logement étudiant";

    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
        <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
          Changement de catégorie requis
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ce logement est configuré pour : <strong>{label}</strong>.
        </p>
        <Link
          href={`${correctPath}?propertyId=${property.id}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark"
        >
          Continuer la réservation en {label}
        </Link>
      </div>
    );
  }

  const maxCapacity = property.capacity?.guests || property.guests || 4;
  const isReserved = property.availabilityStatus === "RESERVED";

  const coverUrl =
    property.images?.[0]?.url ||
    (typeof property.images?.[0] === "string" ? property.images[0] : null) ||
    property.coverImage;

  const PERIOD_LABELS = { night: "nuit", week: "semaine", month: "mois" } as const;

  let displayPrice = 0;
  let displayPeriod = "nuit";
  try {
    const pricing = resolvePropertyPricing(property);
    displayPrice = pricing.unitPrice;
    displayPeriod = PERIOD_LABELS[pricing.pricePeriod];
  } catch {
    displayPrice =
      normalizedCategory === "summer"
        ? property.pricing?.price || property.pricePerNight || property.summerPrice || 0
        : property.pricing?.price || property.studentPrice || property.pricePerNight || 0;
    displayPeriod =
      normalizedCategory === "summer"
        ? property.pricing?.pricePeriod === "night"
          ? "nuit"
          : "semaine"
        : "mois";
  }

  function validateStep1(): boolean {
    setError(null);
    if (!checkIn) {
      setError("Veuillez indiquer votre date d'arrivée.");
      return false;
    }
    if (normalizedCategory === "summer" && !checkOut) {
      setError("Veuillez indiquer votre date de départ.");
      return false;
    }
    if (checkOut && checkIn && checkOut <= checkIn) {
      setError("La date de départ doit être postérieure à la date d'arrivée.");
      return false;
    }
    const numGuests = Number(guests) || 1;
    if (numGuests > maxCapacity) {
      setError(`Le nombre de personnes (${numGuests}) dépasse la capacité maximale (${maxCapacity}).`);
      return false;
    }
    return true;
  }

  function goToStep2() {
    if (validateStep1()) setStep(2);
  }

  function goToStep3() {
    setError(null);
    setStep(3);
  }

  async function handleSubmit(e: FormEvent) {
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

    setSubmitting(true);

    try {
      const payload: any = {
        propertyId: property.id,
        rentalCategory: normalizedCategory,
        fullName: fullName.trim(),
        phone: normalizedPhone,
        email: email.trim() || undefined,
        checkIn,
        checkOut: checkOut || undefined,
        guests: Number(guests) || 1,
        message: message.trim() || undefined,
      };

      if (normalizedCategory === "student" && university.trim()) {
        payload.university = university.trim();
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi de votre demande.");
      }

      trackEvent("request_submitted", {
        propertyId: property.id,
        city: property.city || "Mahdia",
        rentalCategory: normalizedCategory,
        propertyType: property.propertyType,
        forceTrack: true,
        properties: {
          destination: property.city || "Mahdia",
          guests: Number(guests) || 1,
        },
      });

      const queryParams = new URLSearchParams({
        ref: data.id,
        name: fullName.trim(),
        prop: property.title,
        dest: property.city || "Mahdia",
        type: normalizedCategory,
      });

      router.push(`/request/success?${queryParams.toString()}`);
    } catch (err: any) {
      setError(err.message || "Erreur de traitement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Property Summary Header Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative aspect-4/3 w-full sm:w-44 sm:h-32 shrink-0 overflow-hidden rounded-lg bg-surface">
            {coverUrl && (
              <SafeImage
                src={coverUrl}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{property.propertyType || "Logement"}</span>
              <span>•</span>
              <span>
                {property.city} {property.area ? `(${property.area})` : ""}
              </span>
            </div>

            <h2 className="font-display text-lg font-bold text-foreground truncate">
              {property.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <span>{property.capacity?.bedrooms || property.bedrooms || 1} ch.</span>
              <span>•</span>
              <span>{maxCapacity} pers. max</span>
              {property.capacity?.bathrooms && (
                <>
                  <span>•</span>
                  <span>{property.capacity.bathrooms} sdb</span>
                </>
              )}
            </div>

            <p className="pt-2 font-display text-base font-semibold text-primary">
              {formatDT(displayPrice)} DT{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {displayPeriod}
              </span>
            </p>
          </div>
        </div>

        {isReserved && property.reservation?.from && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <Clock className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Ce logement est actuellement réservé sur une période. Veuillez choisir des dates non réservées.
            </span>
          </div>
        )}
      </div>

      {/* Step Wizard Indicator */}
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
            <span>Dates & Voyageurs</span>
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
            <span>Détails & Demandes</span>
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
            <span>Coordonnées & Validation</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Wizard Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Dates & Voyageurs */}
        {step === 1 && (
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Étape 1 sur 3 — Dates de séjour & Voyageurs
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="res-checkin" className="block text-xs font-medium text-foreground mb-1">
                  Date d&apos;arrivée *
                </label>
                <input
                  id="res-checkin"
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="res-checkout" className="block text-xs font-medium text-foreground mb-1">
                  Date de départ {normalizedCategory === "summer" ? "*" : "(facultative)"}
                </label>
                <input
                  id="res-checkout"
                  type="date"
                  required={normalizedCategory === "summer"}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="res-guests" className="block text-xs font-medium text-foreground mb-1">
                Nombre de personnes (max {maxCapacity}) *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  id="res-guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} personne{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={goToStep2}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Suivant : Remarques & Précisions ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Remarques & Options */}
        {step === 2 && (
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Étape 2 sur 3 — Précisions & Remarques
            </h3>

            {normalizedCategory === "student" && (
              <div>
                <label htmlFor="res-university" className="block text-xs font-medium text-foreground mb-1">
                  Université / Faculté (facultatif)
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="res-university"
                    type="text"
                    placeholder="Ex. FSEG Mahdia, ISI, ISET..."
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="res-message" className="block text-xs font-medium text-foreground mb-1">
                Message ou demandes particulières (facultatif)
              </label>
              <textarea
                id="res-message"
                rows={4}
                placeholder="Ex. Heure d'arrivée prévue, besoin d'un lit bébé, quartier préféré..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-3 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={goToStep3}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Suivant : Coordonnées ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Coordonnées & Verification */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Étape 3 sur 3 — Vos coordonnées
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="res-fullname" className="block text-xs font-medium text-foreground mb-1">
                    Nom et prénom *
                  </label>
                  <input
                    id="res-fullname"
                    type="text"
                    required
                    placeholder="Ex. Ahmed Ben Ali"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="res-phone" className="block text-xs font-medium text-foreground mb-1">
                    Téléphone (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      id="res-phone"
                      type="tel"
                      required
                      placeholder="ex: 22 123 456 ou +216 22 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
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
                          ⚠️ Indiquez un numéro tunisien valide (8 chiffres, ex: 22 123 456)
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="res-email" className="block text-xs font-medium text-foreground mb-1">
                  Adresse e-mail (facultatif)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="res-email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Review Card Before Submit */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
              <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Récapitulatif de votre demande
              </h4>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <span className="font-medium text-foreground">Logement :</span> {property.title} ({property.city})
                </div>
                <div>
                  <span className="font-medium text-foreground">Séjour :</span> {checkIn} {checkOut ? `➔ ${checkOut}` : ""}
                </div>
                <div>
                  <span className="font-medium text-foreground">Voyageurs :</span> {guests} personne(s)
                </div>
                <div>
                  <span className="font-medium text-foreground">Client :</span> {fullName || "—"} ({normalizedPhonePreview || phone || "—"})
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
                disabled={submitting}
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi de votre demande…
                  </>
                ) : (
                  "Confirmer & Envoyer ma demande"
                )}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Aucun paiement requis maintenant. Notre équipe vérifie la disponibilité auprès du propriétaire et vous contacte directement pour confirmer.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
