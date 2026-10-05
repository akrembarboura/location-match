"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { PropertyModerationBadge } from "@/components/properties/PropertyModerationBadge";
import { formatDT } from "@/lib/utils";
import {
  Building2,
  PlusCircle,
  Loader2,
  AlertCircle,
  Eye,
  Edit,
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch("/api/owner/properties");
        if (!res.ok) throw new Error("Erreur de chargement de vos biens");
        const data = await res.json();
        setProperties(data || []);
      } catch (err: any) {
        setError(err.message || "Impossible de charger vos biens.");
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  return (
    <OwnerShell
      title="Mes biens"
      subtitle="Gérez les détails, tarifs et disponibilités de vos logements"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement de vos annonces…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Vous n&apos;avez pas encore de logement enregistré.
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Ajoutez votre maison, appartement ou villa pour commencer à louer avec LOC MAISON.
          </p>
          <Link
            href="/owner/list-property"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter une annonce
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const cover =
              property.images?.[0]?.url ||
              (typeof property.images?.[0] === "string" ? property.images[0] : null) ||
              "/placeholder-property.jpg";

            const isPublished = property.status === "PUBLISHED" || property.isPublished;
            const isRented = property.availabilityStatus === "RESERVED";

            return (
              <div
                key={property.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition-all hover:shadow-card flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-surface">
                    <img
                      src={cover}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                      <PropertyModerationBadge status={property.status} />
                      <span className={`rounded-md px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-xs backdrop-blur-xs ${
                        isRented
                          ? "bg-rose-600"
                          : isPublished
                          ? "bg-emerald-600"
                          : "bg-amber-600"
                      }`}>
                        {isRented ? "● Louée" : isPublished ? "✓ Disponible" : "⏳ En attente"}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{property.propertyType || "Logement"}</span>
                      <span>{property.city || property.location?.city || "Mahdia"}</span>
                    </div>

                    <h3 className="font-display text-base font-bold text-foreground line-clamp-1">
                      {property.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className="font-bold text-foreground text-sm">
                        {formatDT(property.pricing?.price || property.pricePerNight || property.summerPrice || 0)} DT
                      </span>
                      <span>/ nuit</span>
                      <span>•</span>
                      <span>{property.capacity?.guests || property.guests || 1} pers.</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 pt-0 border-t border-border mt-3 flex items-center justify-between gap-2">
                  <Link
                    href={`/owner/properties/${property.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Voir
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/owner/properties/${property.id}/availability`}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface/80"
                    >
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      Disponibilités
                    </Link>

                    <Link
                      href={`/owner/properties/${property.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Modifier
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OwnerShell>
  );
}
