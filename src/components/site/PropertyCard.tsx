import Link from "next/link";
import { BedDouble, Bath, MapPin, Ruler } from "lucide-react";
import type { Property } from "@/lib/mock-data";
import { formatDT } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: Property["status"] | string }) {
  const tone =
    status === "Available" || status === "AVAILABLE"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
      : status === "Pending verification"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
        : "bg-muted text-muted-foreground font-medium";

  const statusLabels: Record<string, string> = {
    "Available": "Disponible",
    "AVAILABLE": "Disponible",
    "Booked for summer": "Réservé pour l'été",
    "Rented (academic year)": "Loué (année univ.)",
    "Pending verification": "En attente",
    "RESERVED": "Réservée",
  };

  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[0.7rem]", tone)}>
      {statusLabels[status] || status}
    </span>
  );
}

export function PropertyCard({ property, compact }: { property: any; compact?: boolean }) {
  const coverImg =
    typeof property.images?.[0] === "string"
      ? property.images[0]
      : property.images?.[0]?.url || property.coverImage || "/placeholder-property.jpg";

  const targetLink = `/houses/${property.slug || property.id}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border/75 bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <Link href={targetLink} aria-label={property.title} className="block h-full w-full">
          <img
            src={coverImg}
            alt={property.title}
            loading="lazy"
            width={800}
            height={600}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 z-10">
          {property.availabilityStatus === "RESERVED" && (
            <span className="rounded-md bg-amber-500/95 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              Réservée
            </span>
          )}
          {(property.type || property.propertyType) && (
            <span className="rounded-md bg-card/90 px-2 py-0.5 text-[0.7rem] font-semibold text-foreground shadow-sm backdrop-blur-sm">
              {property.type || property.propertyType}
            </span>
          )}
          {property.verified && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[0.7rem] font-medium text-primary-foreground shadow-sm">
              Vérifié
            </span>
          )}
        </div>
        {property.studentPrice && !property.summerPrice && (
          <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-md bg-accent px-2 py-0.5 text-[0.7rem] font-medium text-accent-foreground shadow-sm">
            Étudiants
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link href={targetLink} className="flex flex-1 flex-col justify-between gap-2.5">
          <div>
            {(property.area || property.city || property.location) && (
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground line-clamp-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {property.area || [property.location, property.city].filter(Boolean).join(", ")}
              </p>
            )}

            <h3 className="mt-1 font-display text-[1.05rem] font-semibold leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
              {property.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5 shrink-0" /> {property.bedrooms} ch.
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 shrink-0" /> {property.bathrooms} sdb.
                </span>
              )}
              {property.surface > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5 shrink-0" /> {property.surface} m²
                </span>
              )}
            </div>

            {!compact && property.amenities?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {property.amenities.slice(0, 3).map((a: string) => (
                  <span key={a} className="rounded bg-muted/70 px-2 py-0.5 text-[0.68rem] text-muted-foreground font-medium">
                    {a}
                  </span>
                ))}
                {property.amenities.length > 3 && (
                  <span className="rounded bg-muted/70 px-2 py-0.5 text-[0.68rem] text-muted-foreground font-medium">
                    +{property.amenities.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between border-t border-border/60 pt-3">
            <div className="space-y-0.5">
              {property.summerPrice ? (
                <p className="font-display text-lg font-bold text-foreground leading-tight">
                  {formatDT(property.summerPrice)} DT{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ sem. · été</span>
                </p>
              ) : null}
              {property.studentPrice ? (
                <p className="font-display text-lg font-bold text-foreground leading-tight">
                  {formatDT(property.studentPrice)} DT{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ mois · univ.</span>
                </p>
              ) : null}
              {!property.summerPrice && !property.studentPrice && property.pricePerNight ? (
                <p className="font-display text-lg font-bold text-foreground leading-tight">
                  {formatDT(property.pricePerNight)} DT{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ nuit</span>
                </p>
              ) : null}
            </div>
            {property.status && <StatusPill status={property.status} />}
          </div>
        </Link>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/75 bg-card shadow-card animate-pulse">
      <div className="aspect-4/3 w-full bg-muted" />
      <div className="p-3.5 sm:p-4 space-y-2.5">
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="mt-auto pt-3 border-t border-border/60 flex justify-between items-center">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-4 w-14 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
