import Link from "next/link";
import { BedDouble, Bath, MapPin, Ruler, Users, ArrowUpRight } from "lucide-react";
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

  const priceVal = property.pricing?.price
    ? property.pricing.price
    : hasSummerPrice
    ? summerPrice
    : hasStudentPrice
    ? studentPrice
    : hasNightlyPrice
    ? nightlyPrice
    : 0;

  const periodLabel = property.pricing?.pricePeriod
    ? (property.pricing.pricePeriod === "month" ? "mois" : property.pricing.pricePeriod === "week" ? "semaine" : "nuit")
    : hasSummerPrice
    ? "semaine"
    : hasStudentPrice
    ? "mois"
    : "nuit";

  const categoryTag = property.type || property.propertyType || "Logement";
  const isReserved = property.availabilityStatus === "RESERVED";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card p-3 shadow-2xs transition-all duration-300 hover:border-border hover:shadow-card">
      {/* Top Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted">
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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Glossy Glass Condition Badge (Top-Left) */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {isReserved ? (
            <span className="inline-flex items-center rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-200 px-3.5 py-1 text-[0.7rem] font-bold shadow-md backdrop-blur-md">
              Réservée
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-950/60 border border-white/20 text-white px-3.5 py-1 text-[0.7rem] font-bold shadow-md backdrop-blur-md">
              {property.studentPrice && !property.summerPrice ? "Logement Étudiant" : "Disponible"}
            </span>
          )}
        </div>

        {/* Shiny Glass Top-Right Action Button */}
        <div className="absolute right-3 top-3 z-20">
          <Link
            href={targetLink}
            aria-label={`Voir ${property.title}`}
            className="group/arrow flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/30 transition-all duration-300 hover:bg-white hover:text-slate-900 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] active:scale-95"
          >
            <ArrowUpRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* Card Content Section */}
      <div className="flex flex-1 flex-col pt-3 px-1 pb-1">
        <Link href={targetLink} className="group/title block">
          {/* Title */}
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground line-clamp-1 transition-colors group-hover/title:text-primary">
            {property.title}
          </h3>

          {/* Location Subtitle */}
          {(property.area || property.city || property.location) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="line-clamp-1">
                {[property.city, property.area || property.location?.area].filter(Boolean).join(", ")}
              </span>
            </p>
          )}
        </Link>

        {/* Features Pill Bar */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {property.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface border border-border/60 px-3 py-1 text-[0.75rem] text-foreground font-medium">
              <BedDouble className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {property.bedrooms} Chambres
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface border border-border/60 px-3 py-1 text-[0.75rem] text-foreground font-medium">
              <Bath className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {property.bathrooms} SDB
            </span>
          )}
          {property.guests > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface border border-border/60 px-3 py-1 text-[0.75rem] text-foreground font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {property.guests} Pers.
            </span>
          )}
          {property.surface > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface border border-border/60 px-3 py-1 text-[0.75rem] text-foreground font-medium">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {property.surface} m²
            </span>
          )}
        </div>

        {/* Bottom Price & Category Tag Row */}
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
          <div>
            <span className="font-display text-xl sm:text-2xl font-extrabold text-black dark:text-white">
              {formatDT(priceVal)} DT
            </span>{" "}
            <span className="text-xs font-medium text-muted-foreground">
              / {periodLabel}
            </span>
          </div>

          <span className="rounded-full bg-surface border border-border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
            {categoryTag}
          </span>
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card p-3 shadow-2xs animate-pulse">
      <div className="aspect-4/3 w-full rounded-2xl bg-muted" />
      <div className="pt-3 px-1 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-16 rounded-full bg-muted" />
        </div>
        <div className="pt-3 border-t border-border/50 flex justify-between items-center">
          <div className="h-6 w-28 rounded bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
