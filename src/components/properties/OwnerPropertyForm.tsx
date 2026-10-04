"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PropertyImageUploader, PropertyImageItem } from "./PropertyImageUploader";
import { AREAS, PROPERTY_TYPES, SUMMER_AMENITIES } from "@/lib/mock-data";

interface OwnerPropertyFormProps {
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    rentalCategory?: "summer" | "student";
    propertyType?: string;
    city?: string;
    area?: string;
    address?: string;
    pricing?: {
      price?: number;
      pricePeriod?: "night" | "week" | "month";
      currency?: string;
    };
    capacity?: {
      guests?: number;
      bedrooms?: number;
      bathrooms?: number;
      surface?: number;
    };
    amenities?: string[];
    images?: PropertyImageItem[];
    status?: string;
    rejectionReason?: string;
  };
  isEditing?: boolean;
}

export function OwnerPropertyForm({
  initialData,
  isEditing = false,
}: OwnerPropertyFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [rentalCategory, setRentalCategory] = useState<"summer" | "student">(
    initialData?.rentalCategory || "summer"
  );
  const [propertyType, setPropertyType] = useState(initialData?.propertyType || "Appartement");
  const [city, setCity] = useState(initialData?.city || "Mahdia");
  const [area, setArea] = useState(initialData?.area || AREAS[0]);
  const [address, setAddress] = useState(initialData?.address || "");

  const [price, setPrice] = useState<number | string>(
    initialData?.pricing?.price !== undefined ? initialData.pricing.price : ""
  );
  const [pricePeriod, setPricePeriod] = useState<"night" | "week" | "month">(
    initialData?.pricing?.pricePeriod || (rentalCategory === "student" ? "month" : "week")
  );

  const [guests, setGuests] = useState<number>(initialData?.capacity?.guests || 4);
  const [bedrooms, setBedrooms] = useState<number>(initialData?.capacity?.bedrooms || 2);
  const [bathrooms, setBathrooms] = useState<number>(initialData?.capacity?.bathrooms || 1);
  const [surface, setSurface] = useState<number | string>(initialData?.capacity?.surface || "");

  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || []);
  const [images, setImages] = useState<PropertyImageItem[]>(initialData?.images || []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAmenity(item: string) {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  }

  async function handleSubmit(asDraft: boolean) {
    try {
      setError(null);

      if (!title.trim()) {
        setError("Veuillez indiquer un titre pour votre logement.");
        return;
      }

      if (!area.trim()) {
        setError("Veuillez sélectionner un quartier.");
        return;
      }

      const numPrice = Number(price);
      if (!asDraft && (!price || isNaN(numPrice) || numPrice <= 0)) {
        setError("Veuillez indiquer un tarif valide supérieur à 0.");
        return;
      }

      if (!asDraft && images.length === 0) {
        setError("Veuillez ajouter au moins une photo pour soumettre votre bien à la vérification.");
        return;
      }

      setLoading(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        rentalCategory,
        propertyType,
        city: city.trim(),
        area: area.trim(),
        address: address.trim() || undefined,
        pricing: {
          price: numPrice > 0 ? numPrice : 0,
          pricePeriod,
          currency: "TND",
        },
        capacity: {
          guests: Number(guests) || 1,
          bedrooms: Number(bedrooms) || 1,
          bathrooms: Number(bathrooms) || 1,
          surface: surface ? Number(surface) : undefined,
        },
        amenities,
        images,
        asDraft,
        resubmit: isEditing && !asDraft,
      };

      const url = isEditing
        ? `/api/owner/properties/${initialData?.id}`
        : "/api/owner/properties";

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'enregistrement.");
      }

      const targetId = data.id || initialData?.id;
      router.push(`/owner/properties/${targetId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erreur de traitement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6">
      <Link
        href="/owner"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour à mes biens
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {isEditing ? "Modifier mon annonce" : "Déposer une annonce"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEditing
            ? "Mettez à jour les informations et photos de votre bien avant resoumission."
            : "Renseignez les détails de votre logement. Il sera vérifié par notre équipe avant publication."}
        </p>
      </div>

      {initialData?.rejectionReason && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Motif du refus précédent :
          </p>
          <p className="mt-1 text-foreground/90 pl-5">{initialData.rejectionReason}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(false);
        }}
        className="space-y-8"
      >
        {/* Section 1: Informations Générales */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">
            1. Informations générales
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Titre de l'annonce *
              </label>
              <input
                type="text"
                required
                placeholder="Ex : Bel appartement S+2 vue mer à 3 min de la plage"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Type de location *
                </label>
                <select
                  value={rentalCategory}
                  onChange={(e) => {
                    const cat = e.target.value as "summer" | "student";
                    setRentalCategory(cat);
                    setPricePeriod(cat === "student" ? "month" : "week");
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="summer">Location d'été (Vacances / Estivants)</option>
                  <option value="student">Logement étudiant (Année universitaire)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Type de bien *
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Description du logement
              </label>
              <textarea
                rows={4}
                placeholder="Décrivez les atouts de votre logement : agencement, proximité des commerces, balcon, calme…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Localisation */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">
            2. Localisation
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Ville *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Quartier / Zone *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Adresse ou repère précis (Optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex : Près de l'Hôtel Mahdia Beach, Rue Ibn Khaldoun"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Capacité & Tarification */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">
            3. Capacité & Tarifs
          </h2>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Voyageurs max
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Chambres
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Salles de bain
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Surface (m²)
              </label>
              <input
                type="number"
                min={10}
                placeholder="Ex : 85"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Prix souhaité (en DT) *
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="Ex : 1200"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Période du tarif *
              </label>
              <select
                value={pricePeriod}
                onChange={(e) => setPricePeriod(e.target.value as any)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="week">Par semaine (Semaine estivale)</option>
                <option value="month">Par mois (Année universitaire / longue durée)</option>
                <option value="night">Par nuit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Équipements */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <h2 className="font-display text-base font-semibold text-foreground mb-3">
            4. Équipements & Prestations
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUMMER_AMENITIES.map((item) => {
              const active = amenities.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAmenity(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {active && "✓ "}
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Photos */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                5. Photos du logement
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Des photos nettes et lumineuses augmentent considérablement l'intérêt des locataires.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {images.length} photo{images.length > 1 ? "s" : ""}
            </span>
          </div>

          <PropertyImageUploader images={images} onChange={setImages} />
        </div>

        {/* Actions bar */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface disabled:opacity-50 transition-colors"
          >
            Enregistrer comme brouillon
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-50 transition-colors shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement…
              </>
            ) : isEditing ? (
              "Enregistrer et resoumettre pour vérification"
            ) : (
              "Soumettre pour vérification"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

