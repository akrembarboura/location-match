import Link from "next/link";
import { BedDouble, Bath, MapPin, Ruler } from "lucide-react";
import type { Property } from "@/lib/mock-data";
import { formatDT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: Property["status"] }) {
  const tone =
    status === "Available"
      ? "bg-success/12 text-success"
      : status === "Pending verification"
        ? "bg-warning/25 text-warning-foreground"
        : "bg-muted text-muted-foreground";
  
  const statusLabels: Record<string, string> = {
    "Available": "Disponible",
    "Booked for summer": "Réservé pour l'été",
    "Rented (academic year)": "Loué (année universitaire)",
    "Pending verification": "En attente de contrôle"
  };

  return (
    <span className={cn("rounded px-2 py-0.5 text-[0.68rem] font-medium", tone)}>{statusLabels[status] || status}</span>
  );
}

export function PropertyCard({ property, compact }: { property: Property; compact?: boolean }) {
  return (
    <Link href={`/properties/${property.id }`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-raised"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={property.images[0]}
          alt={property.title}
          loading="lazy"
          width={1200}
          height={800}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded bg-card/95 px-2 py-0.5 text-[0.68rem] font-semibold text-foreground">
            {property.type}
          </span>
          {property.verified && (
            <span className="rounded bg-primary px-2 py-0.5 text-[0.68rem] font-medium text-primary-foreground">
              Vérifié
            </span>
          )}
        </div>
        {property.studentPrice && !property.summerPrice && (
          <span className="absolute right-3 top-3 rounded bg-accent px-2 py-0.5 text-[0.68rem] font-medium text-accent-foreground">
            Étudiants
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {property.area}
        </div>
        <h3 className="mt-1.5 font-display text-[0.98rem] font-semibold leading-snug text-foreground">
          {property.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} ch.
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {property.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" /> {property.surface} m²
          </span>
        </div>

        {!compact && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {property.amenities.slice(0, 3).map((a) => (
              <span key={a} className="rounded bg-surface px-2 py-0.5 text-[0.68rem] text-muted-foreground">
                {a}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="rounded bg-surface px-2 py-0.5 text-[0.68rem] text-muted-foreground">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3 [margin-top:0.875rem]">
          <div className="space-y-0.5">
            {property.summerPrice && (
              <p className="text-sm font-semibold text-foreground">
                {formatDT(property.summerPrice)} DT{" "}
                <span className="text-xs font-normal text-muted-foreground">/ sem. · été</span>
              </p>
            )}
            {property.studentPrice && (
              <p className="text-sm font-semibold text-foreground">
                {formatDT(property.studentPrice)} DT{" "}
                <span className="text-xs font-normal text-muted-foreground">/ mois · univ.</span>
              </p>
            )}
          </div>
          <StatusPill status={property.status} />
        </div>
      </div>
    </Link>
  );
}
