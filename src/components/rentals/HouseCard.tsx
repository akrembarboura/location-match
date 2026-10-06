"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bath, BedDouble, Camera, Heart, MapPin, Star, Users } from "lucide-react";
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

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/75 bg-card shadow-sm transition-shadow duration-200 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <Link
          href={`/houses/${house.slug}`}
          aria-label={house.title}
          className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <SafeImage
            src={cover?.url}
            alt={cover?.alt ?? house.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 z-10">
          {house.availabilityStatus === "RESERVED" && (
            <span className="rounded-md bg-amber-500/95 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              Réservée
            </span>
          )}
          {house.rentalCategory && (
            <span className="rounded-md bg-card/90 px-2 py-0.5 text-[0.7rem] font-semibold text-foreground shadow-sm backdrop-blur-sm">
              {house.rentalCategory === "summer" ? "Été" : house.rentalCategory === "student" ? "Étudiant" : house.rentalCategory}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-pressed={fav}
          aria-label={fav ? t.card.unfavorite : t.card.favorite}
          className="absolute right-2.5 top-2.5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-card/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-card active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <Heart className={cn("h-5 w-5 transition-colors motion-reduce:transition-none", fav ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
        </button>

        {house.images?.length > 1 && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-foreground/75 px-2.5 py-0.5 text-[0.7rem] font-medium text-background backdrop-blur-sm">
            <Camera className="h-3 w-3" /> {house.images.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/houses/${house.slug}`} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
          <div>
            {house.propertyType && (
              <p className="text-xs font-medium text-muted-foreground">
                {house.propertyType}
              </p>
            )}
            <h3 className="mt-1 line-clamp-2 min-h-11 font-display text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary motion-reduce:transition-none sm:text-xl">
              {house.title}
            </h3>
            {(house.city || house.location) && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm leading-snug text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">
                  {[house.city, house.location].filter(Boolean).join(" · ")}
                </span>
              </p>
            )}
          </div>

          {Number.isFinite(house.pricePerNight) && house.pricePerNight > 0 && (
            <div className="mt-4">
              <span className="font-display text-xl font-bold leading-tight text-foreground">
                {formatPrice(house.pricePerNight)} DT
              </span>{" "}
              <span className="text-sm font-medium text-muted-foreground">
                / {house.rentalCategory === "student" ? "mois" : t.card.perNight}
              </span>
            </div>
          )}

          <div className="mt-2.5 flex min-h-6 flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-muted-foreground">
            {house.guests > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0" /> {t.card.guests(house.guests)}
              </span>
            )}
            {house.bedrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 shrink-0" /> {t.card.bedrooms(house.bedrooms)}
              </span>
            )}
            {house.bathrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-4 w-4 shrink-0" /> {house.bathrooms} sdb.
              </span>
            )}
          </div>

          {house.amenities?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {house.amenities.slice(0, 2).map((amenity) => (
                <span key={amenity} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {amenity}
                </span>
              ))}
              {house.amenities.length > 2 && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  +{house.amenities.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              {house.rentalCategory === "summer" ? "Location d'été" : "Logement étudiant"}
            </span>
            {house.rating !== null && house.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                <span>{house.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({house.reviewCount})</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-primary">{t.card.new}</span>
            )}
          </div>
        </Link>
      </div>
    </article>
  );
}

export function HouseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm animate-pulse">
      <div className="aspect-4/3 w-full bg-muted" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="pt-2 border-t border-border/40 flex justify-between items-center">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-4 w-12 rounded bg-muted" />
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
  const grid = "grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3";
  if (isLoading)
    return <div className={grid}>{Array.from({ length: 8 }, (_, i) => <HouseCardSkeleton key={i} />)}</div>;
  if (isError)
    return <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">{errorText}</p>;
  if (!houses?.length)
    return <p className="rounded-lg border border-dashed border-border bg-sand p-8 text-center text-muted-foreground">{emptyText}</p>;
  return <div className={grid}>{houses.map((h) => <HouseCard key={h.id} house={h} />)}</div>;
}
