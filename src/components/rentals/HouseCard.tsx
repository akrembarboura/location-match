"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bath, BedDouble, Camera, Heart, MapPin, Star, Users, ArrowUpRight, Ruler } from "lucide-react";
import type { House } from "@/lib/rentals/types";
import { formatPrice, getCoverImage } from "@/lib/rentals/types";
import { SafeImage } from "./SafeImage";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics/client";

const FAV_KEY = "favorite-houses";

export function useFavorite(id: string) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    try {
      setFav((JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[]).includes(id));
    } catch {
      /* ignore */
    }
  }, [id]);

  const toggle = () => {
    try {
      const list = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      setFav(next.includes(id));
    } catch {
      setFav((v) => !v);
    }
  };
  return [fav, toggle] as const;
}

export function HouseCard({ house }: { house: House }) {
  const cover = getCoverImage(house);
  const [fav, toggleFav] = useFavorite(house.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav();
    trackEvent(fav ? "property_unfavorited" : "property_favorited", {
      propertyId: house.id,
      city: house.city,
      rentalCategory: house.rentalCategory,
      propertyType: house.propertyType,
      forceTrack: true,
    });
  };

  const targetLink = `/houses/${house.slug}`;

  // Formatting price display
  const priceVal = house.pricing?.price || house.pricePerNight || 0;
  const pricePeriodLabel = house.pricing?.pricePeriod === "month"
    ? "mois"
    : house.pricing?.pricePeriod === "week"
    ? "semaine"
    : house.rentalCategory === "student"
    ? "mois"
    : "nuit";

  // Category Tag
  const categoryTag = house.propertyType || (house.rentalCategory === "summer" ? "Vacances" : "Étudiant");
  const isReserved = house.availabilityStatus === "RESERVED";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card p-3 shadow-2xs transition-all duration-300 hover:border-border hover:shadow-card">
      {/* Top Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted">
        <Link
          href={targetLink}
          aria-label={house.title}
          className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <SafeImage
            src={cover?.url}
            alt={cover?.alt ?? house.title}
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
              {house.rentalCategory === "summer" ? "À louer (Été)" : house.rentalCategory === "student" ? "Logement Étudiant" : "Disponible"}
            </span>
          )}
        </div>

        {/* Shiny Glass Top-Right Buttons (Arrow & Favorite Heart) */}
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-pressed={fav}
            aria-label={fav ? t.card.unfavorite : t.card.favorite}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/30 transition-all duration-300 hover:bg-black/70 hover:scale-105 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] active:scale-95"
          >
            <Heart className={cn("h-4 w-4 transition-colors", fav ? "fill-rose-500 text-rose-500" : "text-white")} />
          </button>

          <Link
            href={targetLink}
            aria-label={`Voir ${house.title}`}
            className="group/arrow flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/30 transition-all duration-300 hover:bg-white hover:text-slate-900 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] active:scale-95"
          >
            <ArrowUpRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5" />
          </Link>
        </div>

        {/* Bottom Left Image Counter Badge */}
        {house.images?.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[0.7rem] font-medium text-white backdrop-blur-md border border-white/10">
            <Camera className="h-3 w-3" /> {house.images.length}
          </span>
        )}
      </div>

      {/* Card Content Section */}
      <div className="flex flex-1 flex-col pt-3 px-1 pb-1">
        <Link href={targetLink} className="group/title block">
          {/* Title */}
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground line-clamp-1 transition-colors group-hover/title:text-primary">
            {house.title}
          </h3>

          {/* Location Subtitle */}
          {(house.city || house.location) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="line-clamp-1">
                {[house.location || house.city, house.city !== house.location ? house.city : null].filter(Boolean).join(", ")}
              </span>
            </p>
          )}
        </Link>

        {/* Features Pill Bar */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs font-medium">
          {house.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 border border-border/80 dark:border-border px-3 py-1 text-[0.75rem] font-semibold text-foreground dark:text-slate-100 shadow-2xs">
              <BedDouble className="h-3.5 w-3.5 text-primary dark:text-sky-400 shrink-0" /> {house.bedrooms} Chambres
            </span>
          )}
          {house.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 border border-border/80 dark:border-border px-3 py-1 text-[0.75rem] font-semibold text-foreground dark:text-slate-100 shadow-2xs">
              <Bath className="h-3.5 w-3.5 text-primary dark:text-sky-400 shrink-0" /> {house.bathrooms} SDB
            </span>
          )}
          {house.guests > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 border border-border/80 dark:border-border px-3 py-1 text-[0.75rem] font-semibold text-foreground dark:text-slate-100 shadow-2xs">
              <Users className="h-3.5 w-3.5 text-primary dark:text-sky-400 shrink-0" /> {house.guests} Pers.
            </span>
          )}
        </div>

        {/* Bottom Price & Category Tag Row */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground dark:text-white">
              {formatPrice(priceVal)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-primary dark:text-sky-400 uppercase tracking-wide">
              DT
            </span>
            <span className="text-xs font-medium text-muted-foreground dark:text-slate-400 ml-0.5">
              / {pricePeriodLabel}
            </span>
          </div>

          <span className="rounded-full bg-surface/90 border border-border/80 dark:border-border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
            {categoryTag}
          </span>
        </div>
      </div>
    </article>
  );
}

export function HouseCardSkeleton() {
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

export function HouseGrid({
  houses,
  isLoading,
  isError,
  emptyText,
  errorText,
}: {
  houses: House[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  emptyText: string;
  errorText?: string;
}) {
  const grid = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
  if (isLoading)
    return <div className={grid}>{Array.from({ length: 8 }, (_, i) => <HouseCardSkeleton key={i} />)}</div>;
  if (isError)
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">{errorText}</p>;
  if (!houses?.length)
    return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">{emptyText}</p>;
  return <div className={grid}>{houses.map((h) => <HouseCard key={h.id} house={h} />)}</div>;
}
