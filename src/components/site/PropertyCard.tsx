import Link from "next/link";
import { BedDouble, Bath, MapPin, Ruler, Users } from "lucide-react";
import type { Property } from "@/lib/mock-data";
import { formatDT } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/rentals/SafeImage";

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
  const summerPrice = Number(property.summerPrice);
  const studentPrice = Number(property.studentPrice);
  const nightlyPrice = Number(property.pricePerNight);
  const hasSummerPrice = Number.isFinite(summerPrice) && summerPrice > 0;
  const hasStudentPrice = Number.isFinite(studentPrice) && studentPrice > 0;
  const hasNightlyPrice = Number.isFinite(nightlyPrice) && nightlyPrice > 0;
  const coverImg =
    typeof property.images?.[0] === "string"
      ? property.images[0]
      : property.images?.[0]?.url || property.coverImage || "/placeholder-property.jpg";

  const targetLink = `/houses/${property.slug || property.id}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/75 bg-card shadow-sm transition-shadow duration-200 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <Link
          href={targetLink}
          aria-label={property.title}
          className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <SafeImage
            src={coverImg}
            alt={property.title}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
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

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={targetLink} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
          <div>
            <h3 className="line-clamp-2 min-h-[2.75rem] font-display text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary motion-reduce:transition-none sm:text-xl">
              {property.title}
            </h3>

            {(property.area || property.city || property.location) && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm leading-snug text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">
                  {[property.city, property.area || property.location?.area].filter(Boolean).join(" · ")}
                </span>
              </p>
            )}
          </div>

          <div className="mt-4 space-y-0.5">
            {hasSummerPrice ? (
              <p className="font-display text-xl font-bold leading-tight text-foreground">
                {formatDT(summerPrice)} DT{" "}
                <span className="text-sm font-medium text-muted-foreground">/ sem. · été</span>
              </p>
            ) : null}
            {hasStudentPrice ? (
              <p className="font-display text-xl font-bold leading-tight text-foreground">
                {formatDT(studentPrice)} DT{" "}
                <span className="text-sm font-medium text-muted-foreground">/ mois · univ.</span>
              </p>
            ) : null}
            {!hasSummerPrice && !hasStudentPrice && hasNightlyPrice ? (
              <p className="font-display text-xl font-bold leading-tight text-foreground">
                {formatDT(nightlyPrice)} DT{" "}
                <span className="text-sm font-medium text-muted-foreground">/ nuit</span>
              </p>
            ) : null}
          </div>

          <div className="mt-2.5 flex min-h-6 flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-muted-foreground">
            {property.guests > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0" /> {property.guests} voyageurs
              </span>
            )}
            <div className="contents">
              {property.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 shrink-0" /> {property.bedrooms} ch.
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Bath className="h-4 w-4 shrink-0" /> {property.bathrooms} sdb.
                </span>
              )}
              {property.surface > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 shrink-0" /> {property.surface} m²
                </span>
              )}
            </div>

            {!compact && property.amenities?.length > 0 && (
              <div className="mt-3 flex w-full flex-wrap gap-1.5">
                {property.amenities.slice(0, 2).map((a: string) => (
                  <span key={a} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    {a}
                  </span>
                ))}
                  {property.amenities.length > 2 && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      +{property.amenities.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              {property.type || property.propertyType}
            </span>
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
